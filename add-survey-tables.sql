CREATE TABLE IF NOT EXISTS surveys (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  "thankYouTitle" TEXT NOT NULL DEFAULT 'Thank you!',
  "thankYouBody" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "primaryColor" TEXT NOT NULL DEFAULT '#1a5c3a',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS survey_questions (
  id TEXT PRIMARY KEY,
  "surveyId" TEXT NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  section TEXT NOT NULL,
  question TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'single',
  options TEXT NOT NULL,
  "maxSelect" INT NOT NULL DEFAULT 1,
  position INT NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_survey_questions_survey ON survey_questions("surveyId");

CREATE TABLE IF NOT EXISTS survey_responses (
  id TEXT PRIMARY KEY,
  "surveyId" TEXT NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  ip TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey ON survey_responses("surveyId");

CREATE TABLE IF NOT EXISTS survey_answers (
  id TEXT PRIMARY KEY,
  "responseId" TEXT NOT NULL REFERENCES survey_responses(id) ON DELETE CASCADE,
  "questionId" TEXT NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_survey_answers_response ON survey_answers("responseId");
CREATE INDEX IF NOT EXISTS idx_survey_answers_question ON survey_answers("questionId");
