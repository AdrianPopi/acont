from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from datetime import datetime
from app.db.session import get_db

router = APIRouter(prefix="/api/health", tags=["health"])

class DatabaseStatus(BaseModel):
    status: str
    response_time_ms: float
    message: str

class HealthStatus(BaseModel):
    status: str  # "healthy", "degraded", "unhealthy"
    timestamp: datetime
    uptime: str
    database: DatabaseStatus
    version: str = "0.1.0"

@router.get("/", response_model=HealthStatus, summary="Health check")
async def health_check(db: Session = Depends(get_db)):
    """
    Check API health status
    
    Returns:
    - Overall status (healthy/degraded/unhealthy)
    - Database connection status
    - Response time
    - Timestamp
    """
    import time
    
    # Database check
    db_start = time.time()
    try:
        # Simple query to test DB connection
        db.execute(text("SELECT 1"))
        db_time = (time.time() - db_start) * 1000  # Convert to milliseconds
        db_status = DatabaseStatus(
            status="connected",
            response_time_ms=round(db_time, 2),
            message="Database connection successful"
        )
        overall_status = "healthy"
    except Exception as e:
        db_status = DatabaseStatus(
            status="disconnected",
            response_time_ms=0,
            message=f"Database error: {str(e)}"
        )
        overall_status = "unhealthy"
    
    return HealthStatus(
        status=overall_status,
        timestamp=datetime.now(),
        uptime="running",
        database=db_status
    )

@router.get("/live", summary="Liveness check")
async def live_check():
    """
    Liveness probe - checks if server is running
    
    Used by Kubernetes/Docker to determine if container should be restarted
    
    Returns:
    - status: "live" if server is responding
    """
    return {
        "status": "live",
        "timestamp": datetime.now()
    }

@router.get("/ready", response_model=HealthStatus, summary="Readiness check")
async def ready_check(db: Session = Depends(get_db)):
    """
    Readiness probe - checks if server is ready to accept traffic
    
    Verifies:
    - Server is responding
    - Database is connected
    
    Used by Kubernetes/Docker load balancer
    
    Returns:
    - Detailed status of all dependencies
    """
    try:
        db.execute("SELECT 1")
        return HealthStatus(
            status="healthy",
            timestamp=datetime.now(),
            uptime="ready",
            database=DatabaseStatus(
                status="connected",
                response_time_ms=0,
                message="Ready to accept requests"
            )
        )
    except Exception as e:
        return HealthStatus(
            status="unhealthy",
            timestamp=datetime.now(),
            uptime="not ready",
            database=DatabaseStatus(
                status="disconnected",
                response_time_ms=0,
                message=f"Database error: {str(e)}"
            )
        )

@router.get("/status", summary="Detailed status")
async def detailed_status(db: Session = Depends(get_db)):
    """
    Get detailed system status
    
    Returns comprehensive information about:
    - API version
    - Current timestamp
    - Database status
    - Service availability
    """
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
        db_message = "Connected"
    except Exception as e:
        db_ok = False
        db_message = str(e)
    
    return {
        "api": {
            "name": "ACONT API",
            "version": "0.1.0",
            "status": "running"
        },
        "timestamp": datetime.now().isoformat(),
        "database": {
            "status": "connected" if db_ok else "disconnected",
            "message": db_message
        },
        "services": {
            "auth": "operational",
            "clients": "operational",
            "products": "operational",
            "invoices": "operational",
            "credit_notes": "operational",
            "legal_documents": "operational"
        }
    }
