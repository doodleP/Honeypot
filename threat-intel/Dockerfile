FROM python:3.14-slim

WORKDIR /app/threat-intel

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY run_pipeline.py ./run_pipeline.py

CMD ["python", "run_pipeline.py"]