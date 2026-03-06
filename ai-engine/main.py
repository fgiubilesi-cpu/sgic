from fastapi import FastAPI
from routers import analysis

app = FastAPI(title="SGIC AI Engine", version="1.0.0")

app.include_router(analysis.router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"status": "ok", "service": "SGIC AI Engine"}
