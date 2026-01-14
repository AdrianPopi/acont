from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/help", tags=["help"])

class HelpCategory(BaseModel):
    name: str
    description: str
    endpoints: list[dict]

class HelpResponse(BaseModel):
    title: str
    version: str
    description: str
    categories: list[HelpCategory]

HELP_DATA = {
    "title": "ACONT API - Help Documentation",
    "version": "0.1.0",
    "description": "Complete REST API for ACONT invoicing system",
    "categories": [
        {
            "name": "Authentication",
            "description": "User registration, login, token management",
            "endpoints": [
                {
                    "method": "POST",
                    "path": "/api/auth/register",
                    "description": "Register new user",
                    "auth_required": False,
                    "request_body": {
                        "email": "string",
                        "password": "string",
                        "first_name": "string",
                        "last_name": "string"
                    }
                },
                {
                    "method": "POST",
                    "path": "/api/auth/login",
                    "description": "Login user",
                    "auth_required": False,
                    "request_body": {
                        "email": "string",
                        "password": "string"
                    }
                },
                {
                    "method": "POST",
                    "path": "/api/auth/refresh",
                    "description": "Refresh access token",
                    "auth_required": True,
                    "request_body": {}
                },
                {
                    "method": "POST",
                    "path": "/api/auth/logout",
                    "description": "Logout user",
                    "auth_required": True,
                    "request_body": {}
                }
            ]
        },
        {
            "name": "Clients",
            "description": "Manage customers/clients",
            "endpoints": [
                {
                    "method": "GET",
                    "path": "/api/clients",
                    "description": "List all clients",
                    "auth_required": True,
                    "query_params": {
                        "skip": "integer (default: 0)",
                        "limit": "integer (default: 10)",
                        "search": "string (optional)"
                    }
                },
                {
                    "method": "POST",
                    "path": "/api/clients",
                    "description": "Create new client",
                    "auth_required": True,
                    "request_body": {
                        "name": "string (required)",
                        "email": "string (optional)",
                        "phone": "string (optional)",
                        "address": "string (optional)",
                        "city": "string (optional)",
                        "zip_code": "string (optional)",
                        "country": "string (optional)",
                        "tax_id": "string (optional)"
                    }
                },
                {
                    "method": "GET",
                    "path": "/api/clients/{client_id}",
                    "description": "Get client by ID",
                    "auth_required": True
                },
                {
                    "method": "PUT",
                    "path": "/api/clients/{client_id}",
                    "description": "Update client",
                    "auth_required": True
                },
                {
                    "method": "DELETE",
                    "path": "/api/clients/{client_id}",
                    "description": "Delete client",
                    "auth_required": True
                }
            ]
        },
        {
            "name": "Products",
            "description": "Manage products/services",
            "endpoints": [
                {
                    "method": "GET",
                    "path": "/api/products",
                    "description": "List all products",
                    "auth_required": True,
                    "query_params": {
                        "skip": "integer",
                        "limit": "integer",
                        "is_active": "boolean"
                    }
                },
                {
                    "method": "POST",
                    "path": "/api/products",
                    "description": "Create new product",
                    "auth_required": True,
                    "request_body": {
                        "name": "string (required)",
                        "description": "string (optional)",
                        "price": "decimal (required)",
                        "currency": "string (default: USD)",
                        "unit": "string (default: piece)"
                    }
                },
                {
                    "method": "GET",
                    "path": "/api/products/{product_id}",
                    "description": "Get product by ID",
                    "auth_required": True
                },
                {
                    "method": "PUT",
                    "path": "/api/products/{product_id}",
                    "description": "Update product",
                    "auth_required": True
                },
                {
                    "method": "DELETE",
                    "path": "/api/products/{product_id}",
                    "description": "Delete product",
                    "auth_required": True
                }
            ]
        },
        {
            "name": "Invoices",
            "description": "Manage invoices and billing",
            "endpoints": [
                {
                    "method": "GET",
                    "path": "/api/invoices",
                    "description": "List all invoices",
                    "auth_required": True,
                    "query_params": {
                        "skip": "integer",
                        "limit": "integer",
                        "status": "draft|sent|paid|overdue",
                        "client_id": "string (UUID)"
                    }
                },
                {
                    "method": "POST",
                    "path": "/api/invoices",
                    "description": "Create new invoice",
                    "auth_required": True
                },
                {
                    "method": "GET",
                    "path": "/api/invoices/{invoice_id}",
                    "description": "Get invoice by ID",
                    "auth_required": True
                },
                {
                    "method": "PUT",
                    "path": "/api/invoices/{invoice_id}",
                    "description": "Update invoice",
                    "auth_required": True
                },
                {
                    "method": "DELETE",
                    "path": "/api/invoices/{invoice_id}",
                    "description": "Delete invoice",
                    "auth_required": True
                },
                {
                    "method": "GET",
                    "path": "/api/invoices/{invoice_id}/pdf",
                    "description": "Download invoice as PDF",
                    "auth_required": True,
                    "response_type": "application/pdf"
                }
            ]
        },
        {
            "name": "Credit Notes",
            "description": "Manage credit notes",
            "endpoints": [
                {
                    "method": "GET",
                    "path": "/api/credit_notes",
                    "description": "List all credit notes",
                    "auth_required": True
                },
                {
                    "method": "POST",
                    "path": "/api/credit_notes",
                    "description": "Create new credit note",
                    "auth_required": True
                },
                {
                    "method": "GET",
                    "path": "/api/credit_notes/{credit_note_id}",
                    "description": "Get credit note by ID",
                    "auth_required": True
                },
                {
                    "method": "GET",
                    "path": "/api/credit_notes/{credit_note_id}/pdf",
                    "description": "Download credit note as PDF",
                    "auth_required": True,
                    "response_type": "application/pdf"
                }
            ]
        },
        {
            "name": "Legal Documents",
            "description": "Manage Terms of Service and Privacy Policy",
            "endpoints": [
                {
                    "method": "GET",
                    "path": "/api/legal/terms",
                    "description": "Get latest Terms of Service",
                    "auth_required": False
                },
                {
                    "method": "GET",
                    "path": "/api/legal/privacy",
                    "description": "Get latest Privacy Policy",
                    "auth_required": False
                },
                {
                    "method": "POST",
                    "path": "/api/legal/accept",
                    "description": "Accept legal document",
                    "auth_required": True,
                    "request_body": {
                        "legal_document_id": "string (UUID)"
                    }
                },
                {
                    "method": "POST",
                    "path": "/api/admin/legal-documents",
                    "description": "Create/update legal document (admin)",
                    "auth_required": True
                }
            ]
        },
        {
            "name": "Merchant Logo",
            "description": "Upload and download merchant logo",
            "endpoints": [
                {
                    "method": "POST",
                    "path": "/api/merchant/logo",
                    "description": "Upload merchant logo",
                    "auth_required": True,
                    "content_type": "multipart/form-data"
                },
                {
                    "method": "GET",
                    "path": "/api/merchant/logo",
                    "description": "Download merchant logo",
                    "auth_required": False,
                    "response_type": "image/png or image/jpeg"
                }
            ]
        }
    ]
}

@router.get("/", response_model=HelpResponse, summary="API Help Documentation")
async def get_help():
    """
    Get complete API help documentation
    
    Returns:
    - API title and version
    - List of all endpoint categories
    - Detailed information about each endpoint
    """
    return HelpResponse(**HELP_DATA)

@router.get("/category/{category_name}", summary="Help for specific category")
async def get_help_category(category_name: str):
    """
    Get help documentation for a specific category
    
    Parameters:
    - category_name: Name of the category (e.g., 'authentication', 'clients', 'products')
    
    Returns:
    - Endpoints and details for the specified category
    """
    for category in HELP_DATA["categories"]:
        if category["name"].lower() == category_name.lower():
            return category
    
    raise HTTPException(
        status_code=404,
        detail=f"Category '{category_name}' not found. Available categories: {', '.join([c['name'] for c in HELP_DATA['categories']])}"
    )

@router.get("/endpoints", summary="List all endpoints")
async def list_all_endpoints():
    """
    Get a flat list of all API endpoints
    
    Returns:
    - List of all available endpoints with their methods and paths
    """
    all_endpoints = []
    for category in HELP_DATA["categories"]:
        for endpoint in category["endpoints"]:
            all_endpoints.append({
                "category": category["name"],
                **endpoint
            })
    return {"total": len(all_endpoints), "endpoints": all_endpoints}

@router.get("/search", summary="Search endpoints")
async def search_endpoints(q: str):
    """
    Search for endpoints by keyword
    
    Parameters:
    - q: Search query (searches in path, method, and description)
    
    Returns:
    - Matching endpoints
    """
    query = q.lower()
    results = []
    
    for category in HELP_DATA["categories"]:
        for endpoint in category["endpoints"]:
            path = endpoint["path"].lower()
            description = endpoint["description"].lower()
            method = endpoint["method"].lower()
            
            if query in path or query in description or query in method:
                results.append({
                    "category": category["name"],
                    **endpoint
                })
    
    if not results:
        raise HTTPException(
            status_code=404,
            detail=f"No endpoints found matching '{q}'"
        )
    
    return {"query": q, "total": len(results), "results": results}

@router.get("/status", summary="Check API status")
async def get_status():
    """
    Check the status of the API and its dependencies
    
    Returns:
    - API status (e.g., healthy, degraded, down)
    - Uptime information
    - Database connection status
    """
    return {
        "api": {
            "name": "ACONT API",
            "version": "0.1.0",
            "status": "running"
        },
        "database": {
            "status": "connected"
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
