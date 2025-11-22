# Testing Guide - Hybrid Search Module

## Швидкий старт

### 1. Встановлення залежностей

```bash
cd apps/api
pip install -r requirements.txt
pip install pytest pytest-asyncio pytest-mock pytest-cov
```

### 2. Запуск тестів

```bash
# Всі тести
pytest tests/ -v

# З покриттям
pytest tests/ --cov=services --cov=models --cov-report=html

# Конкретний тест
pytest tests/test_hybrid_search.py::TestTextSanitizer::test_clean_text_removes_emails -v
```

### 3. Запуск API сервера

```bash
cd apps/api
python -m uvicorn app.main:app --reload --port 8000
```

### 4. Тестування через API

#### Health Check
```bash
curl http://localhost:8000/api/v1/hybrid-search/health
```

#### Завантаження резюме
```bash
curl -X POST http://localhost:8000/api/v1/hybrid-search/process-resume \
  -F "file=@path/to/resume.pdf" \
  -F "candidate_id=123"
```

#### Пошук відповідностей
```bash
curl -X POST http://localhost:8000/api/v1/hybrid-search/find-matches \
  -H "Content-Type: application/json" \
  -d '{
    "job_description": "Python developer with FastAPI experience",
    "k": 5,
    "search_type": "hybrid"
  }'
```

## Тестування Frontend

### 1. Запуск frontend

```bash
cd apps/web
pnpm install
pnpm dev
```

### 2. Тестування в браузері

1. Відкрийте http://localhost:5173 (або інший порт)
2. Увійдіть як HR Manager
3. Перейдіть до Dashboard
4. Знайдіть секцію "Resume Matching"

### 3. Кроки тестування

#### Завантаження резюме:
1. Натисніть "Upload Resume"
2. Завантажте PDF або DOCX файл
3. Перевірте повідомлення про успіх

#### Пошук відповідностей:
1. Виберіть або створіть Job Description
2. Введіть опис вакансії в поле пошуку
3. Виберіть тип пошуку (Hybrid/Vector/Keyword)
4. Натисніть "Find Matches"
5. Перевірте результати зі скором та метаданими

## Приклади тестових даних

### Тестове резюме (PDF/DOCX)

```
John Doe
Senior Python Developer

Contact:
Email: john.doe@example.com
Phone: +380 50 123 4567
LinkedIn: https://linkedin.com/in/johndoe

Experience:
- 5+ years of Python development
- Expert in FastAPI and Django frameworks
- RESTful API design and implementation
- Database optimization (PostgreSQL, MongoDB)
- Microservices architecture
- Docker and Kubernetes deployment

Skills:
Python, FastAPI, Django, PostgreSQL, MongoDB, Docker, Kubernetes, AWS
```

### Тестова вакансія

```
Job Title: Senior Python Developer

We are looking for an experienced Python developer with strong FastAPI skills.
The ideal candidate should have:
- 5+ years of Python development experience
- Expertise in FastAPI framework
- Experience with RESTful API design
- Database optimization skills
- Knowledge of Docker and containerization
```

## Очікувані результати

### Після завантаження резюме:
- ✅ Повідомлення "Resume processed successfully"
- ✅ Файл оброблено та проіндексовано
- ✅ ChromaDB створено/оновлено

### Після пошуку:
- ✅ Результати зі скором від 0 до 1
- ✅ Відображено релевантні фрагменти тексту
- ✅ Метадані файлу (filename, source_type)
- ✅ Тип пошуку (hybrid/vector/keyword)

## Troubleshooting

### Помилка: "Documents must be indexed"
**Рішення:** Спочатку завантажте резюме через `/process-resume`

### Помилка: "File not found"
**Рішення:** Перевірте шлях до файлу та формат (PDF/DOCX)

### Помилка: ChromaDB persistence
**Рішення:** Перевірте права доступу до директорії `./chroma_db`

### Frontend: API не відповідає
**Рішення:** 
1. Перевірте `VITE_API_URL` в `.env`
2. Переконайтеся, що API сервер запущено
3. Перевірте CORS налаштування

## Додаткові тести

### Тест PII Masking
```python
from services.text_sanitizer import TextSanitizer

text = "Contact john@example.com or +380 50 123 4567"
result = TextSanitizer.clean_text(text)
assert "<EMAIL_REDACTED>" in result
assert "<PHONE_REDACTED>" in result
```

### Тест Chunking
```python
from services.hybrid_matcher import HybridMatcher
from langchain_core.documents import Document

matcher = HybridMatcher()
documents = [Document(page_content="Long text...", metadata={})]
chunks = matcher.text_splitter.split_documents(documents)
assert len(chunks) > 0
```

### Тест Hybrid Search Weights
```python
matcher = HybridMatcher()
assert matcher.vector_weight == 0.7
assert matcher.bm25_weight == 0.3
```

