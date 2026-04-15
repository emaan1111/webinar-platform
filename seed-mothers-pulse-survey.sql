-- Seed: The Mother's Pulse Check survey
-- Run once to insert the initial survey with all 10 questions

INSERT INTO surveys (id, title, slug, description, "thankYouTitle", "thankYouBody", "isActive", "primaryColor", "createdAt", "updatedAt")
VALUES (
  'survey_mothers_pulse_check',
  'The Mother''s Pulse Check',
  'mothers-pulse-check',
  'A private, honest check-in for Muslim mothers navigating these difficult times. No judgment. Just truth. 2 minutes.',
  'JazakAllahu Khairan, dear sister',
  '<p>Your honesty matters more than you know. You are not alone in what you''re feeling — and the fact that you took the time to reflect on your children''s upbringing tells me something important about you:</p><p style="font-size:20px;font-weight:600;color:#1a5c3a;font-style:italic;margin:24px 0;">You haven''t given up. You''re looking for a way forward.</p><p>We''re gathering responses from mothers across the ummah to understand what families are going through right now — so we can serve you better. May Allah make it easy for you and bless your children.</p>',
  true,
  '#1a5c3a',
  NOW(), NOW()
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO survey_questions (id, "surveyId", section, question, type, options, "maxSelect", position, "createdAt", "updatedAt") VALUES
('sq_stress', 'survey_mothers_pulse_check', 'How You''re Feeling Right Now',
 'Over the past few weeks, how would you describe your overall stress level compared to a year ago?',
 'single',
 '["Much more stressed than usual — I feel like I''m drowning","Noticeably more stressed — things feel heavier","About the same as usual","Actually feeling calmer than before"]',
 1, 0, NOW(), NOW()),

('sq_stress_source', 'survey_mothers_pulse_check', 'How You''re Feeling Right Now',
 'What is weighing on you MOST right now? (Pick your top 2)',
 'multi',
 '["Rising cost of living — groceries, fuel, bills","Fear and anxiety about the wars and global instability","My children''s behaviour and attitude","Feeling alone in parenting — no village, no support","My own mental health and exhaustion","Worry about my children''s future as Muslims in the West","Marriage/relationship tension","Work pressure and not having enough time"]',
 2, 1, NOW(), NOW()),

('sq_tarbiya_time', 'survey_mothers_pulse_check', 'Your Children''s Spiritual Development',
 'Honestly — in the last few months, has the time you spend on your children''s Islamic character building (tarbiya, Quran, conversations about deen) gone up or down?',
 'single',
 '["It''s gone down a lot — I barely have energy for it","It''s slipped — I notice it but can''t seem to fix it","It''s about the same","It''s actually increased — the state of the world has made me more intentional"]',
 1, 2, NOW(), NOW()),

('sq_tarbiya_barriers', 'survey_mothers_pulse_check', 'Your Children''s Spiritual Development',
 'What''s the BIGGEST barrier stopping you from investing in your child''s character and spiritual growth right now?',
 'single',
 '["I''m too exhausted — by the time I get to them I have nothing left","They resist it — salah battles, Quran complaints, eye-rolling","I don''t know HOW — I want to but I don''t have a framework or method","Screens have taken over and I can''t compete","I''m working too much to be present","My own iman feels low right now, so I feel like a hypocrite"]',
 1, 3, NOW(), NOW()),

('sq_child_changes', 'survey_mothers_pulse_check', 'What You''re Seeing In Your Children',
 'Have you noticed any of these changes in your child recently? (Select all that apply)',
 'multi',
 '["More anxious or worried than usual","More defiant, argumentative, or rude","Withdrawing — spending more time alone or on screens","Complaining of stomachaches, headaches, or trouble sleeping","Less interested in Islamic activities (salah, Quran, Islamic learning)","Seeming flat, unmotivated, or like they don''t care about anything","More emotional outbursts or meltdowns","Asking difficult questions about the world, war, or being Muslim","Stopped asking for things — seems to be trying not to be a burden","None of the above — my child seems fine"]',
 99, 4, NOW(), NOW()),

('sq_guilt', 'survey_mothers_pulse_check', 'The Guilt Question',
 'Do you feel guilty about how things are going with your children''s upbringing right now?',
 'single',
 '["Yes — deeply. I know I''m failing them and it keeps me up at night","Yes — I feel it but I don''t know what to do differently","Sometimes — but I try to remind myself I''m doing my best","Not really — I think things are going OK"]',
 1, 5, NOW(), NOW()),

('sq_guilt_thought', 'survey_mothers_pulse_check', 'The Guilt Question',
 'Which of these thoughts has crossed your mind recently?',
 'single',
 '["\"I''m raising my kids in survival mode, not with intention\"","\"My kids are watching me stressed and anxious — what are they learning?\"","\"I''ve lost my child to screens and I don''t know how to get them back\"","\"I want to be the mother my children deserve but I''m running on empty\"","\"I''m scared about the kind of Muslim my child is becoming\"","None of these — I feel at peace with how things are going"]',
 1, 6, NOW(), NOW()),

('sq_need', 'survey_mothers_pulse_check', 'What You Need Most',
 'If you could have ONE thing right now to help you with your children''s upbringing, what would it be?',
 'single',
 '["A clear, practical framework — show me exactly what to do and when","A community of mothers who understand — I need to not feel alone","Someone to take my child through a transformation — I can''t do it alone anymore","Help with my OWN emotional state first — I can''t pour from an empty cup","Islamic guidance specifically — how to do tarbiya the prophetic way","Just time. I need more hours in the day"]',
 1, 7, NOW(), NOW()),

('sq_age_range', 'survey_mothers_pulse_check', 'About Your Family',
 'What age range is your child (or the child you''re most concerned about)?',
 'single',
 '["Under 5","5–8 years old","9–11 years old","12–14 years old","15–17 years old","18+"]',
 1, 8, NOW(), NOW()),

('sq_location', 'survey_mothers_pulse_check', 'About Your Family',
 'Where are you based?',
 'single',
 '["United States","United Kingdom","Canada","Australia","Europe (other)","Other"]',
 1, 9, NOW(), NOW())

ON CONFLICT (id) DO NOTHING;
