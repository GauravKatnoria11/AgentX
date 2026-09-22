from fastapi import FastAPI

app = FastAPI(title="TNHackathon Backend")


@app.get("/")
def read_root():
    return {"message": "Backend is running", "status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)