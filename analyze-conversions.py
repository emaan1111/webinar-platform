import psycopg2
from datetime import datetime, timedelta

conn = psycopg2.connect(
    'postgresql://postgres:PGROlPewsCXdLjtvRxwAestaVJGldXmb@gondola.proxy.rlwy.net:24954/railway'
)
cur = conn.cursor()

print('=' * 70)
print('CONVERSION ANALYSIS - LAST 7 DAYS vs PREVIOUS 7 DAYS')
print('=' * 70)

# 1. Sales/Conversions comparison
cur.execute('''
    SELECT 
        CASE 
            WHEN "purchasedAt" >= NOW() - INTERVAL '7 days' THEN 'Last 7 Days'
            WHEN "purchasedAt" >= NOW() - INTERVAL '14 days' THEN 'Previous 7 Days'
        END as period,
        COUNT(*) as sales_count,
        SUM(amount) as total_revenue
    FROM webinar_sales
    WHERE "purchasedAt" >= NOW() - INTERVAL '14 days'
    GROUP BY period
    ORDER BY period DESC
''')
print('\nSALES COMPARISON:')
print('-' * 50)
results = cur.fetchall()
if results:
    for row in results:
        period, count, revenue = row
        if period:
            print(f'{period}: {count} sales, ${revenue or 0:.2f} revenue')
else:
    print('NO SALES in either period!')

# Check total sales ever
cur.execute('SELECT COUNT(*), SUM(amount) FROM webinar_sales')
total_sales, total_rev = cur.fetchone()
print(f'\n(Total all-time: {total_sales} sales, ${total_rev or 0:.2f})')

# 2. Registration to Attendance funnel
cur.execute('''
    SELECT 
        CASE 
            WHEN "registeredAt" >= NOW() - INTERVAL '7 days' THEN 'Last 7 Days'
            WHEN "registeredAt" >= NOW() - INTERVAL '14 days' THEN 'Previous 7 Days'
        END as period,
        COUNT(*) as registrations,
        SUM(CASE WHEN attended = true THEN 1 ELSE 0 END) as attended,
        SUM(CASE WHEN "hasPurchased" = true THEN 1 ELSE 0 END) as purchased
    FROM registrations
    WHERE "registeredAt" >= NOW() - INTERVAL '14 days'
    GROUP BY period
    ORDER BY period DESC
''')
print('\nFUNNEL COMPARISON:')
print('-' * 50)
for row in cur.fetchall():
    period, regs, attended, purchased = row
    if period:
        attend_rate = (attended/regs*100) if regs > 0 else 0
        purchase_rate = (purchased/regs*100) if regs > 0 else 0
        print(f'{period}:')
        print(f'  Registrations: {regs}')
        print(f'  Attended: {attended} ({attend_rate:.1f}%)')
        print(f'  Purchased: {purchased} ({purchase_rate:.1f}%)')

# 3. Watch time comparison (engagement)
cur.execute('''
    SELECT 
        CASE 
            WHEN "joinedAt" >= NOW() - INTERVAL '7 days' THEN 'Last 7 Days'
            WHEN "joinedAt" >= NOW() - INTERVAL '14 days' THEN 'Previous 7 Days'
        END as period,
        AVG(COALESCE("watchDuration", 0) + COALESCE("totalWatchTime", 0)) as avg_watch,
        COUNT(*) as sessions
    FROM attendee_sessions
    WHERE "joinedAt" >= NOW() - INTERVAL '14 days'
    GROUP BY period
    ORDER BY period DESC
''')
print('\nENGAGEMENT (Watch Time):')
print('-' * 50)
for row in cur.fetchall():
    period, avg_watch, sessions = row
    if period:
        avg_mins = float(avg_watch or 0) / 60
        print(f'{period}: {avg_mins:.1f} min avg watch time ({sessions} sessions)')

# 4. Drop-off analysis - where do people leave?
cur.execute('''
    SELECT 
        CASE 
            WHEN "videoPosition" < 300 THEN '0-5 min'
            WHEN "videoPosition" < 600 THEN '5-10 min'
            WHEN "videoPosition" < 1200 THEN '10-20 min'
            WHEN "videoPosition" < 1800 THEN '20-30 min'
            WHEN "videoPosition" < 2700 THEN '30-45 min'
            WHEN "videoPosition" < 3600 THEN '45-60 min'
            ELSE '60+ min'
        END as drop_point,
        COUNT(*) as count
    FROM attendee_sessions
    WHERE "joinedAt" >= NOW() - INTERVAL '7 days'
    GROUP BY drop_point
    ORDER BY MIN("videoPosition")
''')
print('\nDROP-OFF POINTS (Last 7 Days):')
print('-' * 50)
total_sessions = 0
drop_data = []
for row in cur.fetchall():
    point, count = row
    total_sessions += count
    drop_data.append((point, count))

for point, count in drop_data:
    pct = (count/total_sessions*100) if total_sessions > 0 else 0
    bar = '#' * int(pct/2)
    print(f'{point:>10}: {count:>4} ({pct:>5.1f}%) {bar}')

# 5. CTA/Offer engagement
cur.execute('''
    SELECT 
        CASE 
            WHEN "createdAt" >= NOW() - INTERVAL '7 days' THEN 'Last 7 Days'
            WHEN "createdAt" >= NOW() - INTERVAL '14 days' THEN 'Previous 7 Days'
        END as period,
        SUM(CASE WHEN "sawOffer" = true THEN 1 ELSE 0 END) as saw_offer,
        SUM(CASE WHEN "clickedOffer" = true THEN 1 ELSE 0 END) as clicked,
        COUNT(*) as total
    FROM offer_analytics
    WHERE "createdAt" >= NOW() - INTERVAL '14 days'
    GROUP BY period
    ORDER BY period DESC
''')
print('\nCTA/OFFER ENGAGEMENT:')
print('-' * 50)
results = cur.fetchall()
if results:
    for row in results:
        period, saw, clicked, total = row
        if period:
            click_rate = (clicked/saw*100) if saw > 0 else 0
            print(f'{period}: {saw} saw offer, {clicked} clicked ({click_rate:.1f}% CTR)')
else:
    print('No offer engagement data')

# 6. Check muted viewing
cur.execute('''
    SELECT 
        CASE 
            WHEN "joinedAt" >= NOW() - INTERVAL '7 days' THEN 'Last 7 Days'
            WHEN "joinedAt" >= NOW() - INTERVAL '14 days' THEN 'Previous 7 Days'
        END as period,
        SUM(CASE WHEN "watchedMuted" = true THEN 1 ELSE 0 END) as muted_count,
        COUNT(*) as total,
        AVG(COALESCE("mutedDuration", 0)) as avg_muted_duration
    FROM attendee_sessions
    WHERE "joinedAt" >= NOW() - INTERVAL '14 days'
    GROUP BY period
    ORDER BY period DESC
''')
print('\nMUTED VIEWING (Critical for Conversions):')
print('-' * 50)
for row in cur.fetchall():
    period, muted, total, avg_muted = row
    if period:
        muted_pct = (muted/total*100) if total > 0 else 0
        avg_muted_mins = float(avg_muted or 0) / 60
        status = '<-- HIGH!' if muted_pct > 30 else 'OK'
        print(f'{period}: {muted}/{total} watched muted ({muted_pct:.1f}%) {status}')
        print(f'  Avg muted duration: {avg_muted_mins:.1f} min')

# 7. Daily breakdown last 7 days
cur.execute('''
    SELECT 
        DATE(r."registeredAt") as date,
        COUNT(*) as registrations,
        SUM(CASE WHEN r.attended = true THEN 1 ELSE 0 END) as attended,
        SUM(CASE WHEN r."hasPurchased" = true THEN 1 ELSE 0 END) as purchased
    FROM registrations r
    WHERE r."registeredAt" >= NOW() - INTERVAL '7 days'
    GROUP BY DATE(r."registeredAt")
    ORDER BY date DESC
''')
day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
print('\nDAILY BREAKDOWN (Last 7 Days):')
print('-' * 50)
print(f'{"Date":<12} {"Day":<10} {"Regs":>6} {"Attend":>8} {"Purch":>7} {"Conv%":>7}')
for row in cur.fetchall():
    date, regs, attended, purchased = row
    day = day_names[date.weekday()]
    conv = (purchased/attended*100) if attended > 0 else 0
    print(f'{str(date):<12} {day:<10} {regs:>6} {attended:>8} {purchased:>7} {conv:>6.1f}%')

# 8. Check video errors
cur.execute('''
    SELECT 
        CASE 
            WHEN "createdAt" >= NOW() - INTERVAL '7 days' THEN 'Last 7 Days'
            WHEN "createdAt" >= NOW() - INTERVAL '14 days' THEN 'Previous 7 Days'
        END as period,
        COUNT(*) as errors,
        COUNT(DISTINCT "registrationId") as affected_users
    FROM video_errors
    WHERE "createdAt" >= NOW() - INTERVAL '14 days'
    GROUP BY period
    ORDER BY period DESC
''')
print('\nVIDEO ERRORS:')
print('-' * 50)
results = cur.fetchall()
if results:
    for row in results:
        period, errors, users = row
        if period:
            print(f'{period}: {errors} errors affecting {users} users')
else:
    print('No video errors recorded')

# 9. Check average video position at exit
cur.execute('''
    SELECT 
        CASE 
            WHEN "joinedAt" >= NOW() - INTERVAL '7 days' THEN 'Last 7 Days'
            WHEN "joinedAt" >= NOW() - INTERVAL '14 days' THEN 'Previous 7 Days'
        END as period,
        AVG("videoPosition") as avg_exit_position,
        MAX("videoPosition") as max_position
    FROM attendee_sessions
    WHERE "joinedAt" >= NOW() - INTERVAL '14 days'
    GROUP BY period
    ORDER BY period DESC
''')
print('\nAVG VIDEO EXIT POSITION:')
print('-' * 50)
for row in cur.fetchall():
    period, avg_pos, max_pos = row
    if period:
        avg_mins = float(avg_pos or 0) / 60
        max_mins = float(max_pos or 0) / 60
        print(f'{period}: Avg exit at {avg_mins:.1f} min (max {max_mins:.1f} min)')

# 10. Compare with previous successful period (3-4 weeks ago)
print('\n' + '=' * 70)
print('COMPARISON WITH SUCCESSFUL PERIOD (3-4 weeks ago)')
print('=' * 70)
cur.execute('''
    SELECT 
        COUNT(*) as registrations,
        SUM(CASE WHEN attended = true THEN 1 ELSE 0 END) as attended,
        SUM(CASE WHEN "hasPurchased" = true THEN 1 ELSE 0 END) as purchased
    FROM registrations
    WHERE "registeredAt" >= NOW() - INTERVAL '28 days'
    AND "registeredAt" < NOW() - INTERVAL '21 days'
''')
row = cur.fetchone()
if row:
    regs, attended, purchased = row
    attend_rate = (attended/regs*100) if regs > 0 else 0
    conv_rate = (purchased/attended*100) if attended > 0 else 0
    print(f'3-4 weeks ago: {regs} regs, {attended} attended ({attend_rate:.1f}%), {purchased} purchased ({conv_rate:.1f}% conv)')

cur.close()
conn.close()
