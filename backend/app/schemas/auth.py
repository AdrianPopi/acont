from pydantic import BaseModel, EmailStr, Field
from app.core.countries import CountryCode

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class AuthOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str

class MerchantSignupIn(BaseModel):
    first_name: str
    last_name: str
    company_name: str
    country_code: CountryCode = CountryCode.RO
    phone: str = ""
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

     # ✅ legal (enterprise)
    accept_terms: bool = Field(default=False)
    accept_privacy: bool = Field(default=False)
    locale: str = Field(default="en", max_length=16)


class LegalAcceptIn(BaseModel):
    accept_terms: bool = Field(default=False)
    accept_privacy: bool = Field(default=False)
    locale: str = Field(default="en", max_length=16)