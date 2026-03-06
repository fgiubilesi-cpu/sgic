import os
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

router = APIRouter()

class NCAnalysisRequest(BaseModel):
    title: str
    description: str
    severity: str

class NCAnalysisResponse(BaseModel):
    root_cause_analysis: str = Field(description="A detailed analysis of the potential root cause of the non-conformity.")
    suggested_action_plan: str = Field(description="A step-by-step suggested corrective action plan.")

async def verify_internal_api_key(x_internal_api_key: str = Header(None)):
    expected_key = os.getenv("AI_ENGINE_API_KEY", "secret_internal_key_123")
    if not x_internal_api_key or x_internal_api_key != expected_key:
        raise HTTPException(status_code=403, detail="Invalid or missing X-Internal-API-Key")
    return x_internal_api_key

@router.post("/analyze-nc", response_model=NCAnalysisResponse)
async def analyze_nc(
    request: NCAnalysisRequest,
    api_key: str = Depends(verify_internal_api_key)
):
    try:
        # Require OPENAI_API_KEY to be in the environment for LangChain
        llm = ChatOpenAI(model="gpt-4o", temperature=0.2)
        
        structured_llm = llm.with_structured_output(NCAnalysisResponse)
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an expert ISO 9001 Lead Auditor. Your task is to analyze a reported non-conformity and provide a likely root cause analysis and a practical, step-by-step corrective action plan. Be professional, concise, and adhere to ISO 9001 quality management principles. Respond ONLY with the requested structured JSON data."),
            ("human", "Title: {title}\nDescription: {description}\nSeverity: {severity}\n\nPlease analyze this non-conformity.")
        ])
        
        chain = prompt | structured_llm
        
        response = chain.invoke({
            "title": request.title,
            "description": request.description,
            "severity": request.severity
        })
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
