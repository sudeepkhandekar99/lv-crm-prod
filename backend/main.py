from fastapi import FastAPI, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import asc  # Import for ascending order
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Access the DATABASE_URL variable
DATABASE_URL = os.getenv("DATABASE_URL")


app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (or specify a list of allowed origins)
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

@app.get("/")
def read_root():
    return {"message": "CORS is enabled!"}

# Database Configuration
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Database Model
class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(255), nullable=True)
    main_cat = Column(String(255), nullable=True)
    sub_cat = Column(String(255), nullable=True)
    brand = Column(String(255), nullable=True)
    model = Column(String(255), nullable=True)
    housing_size = Column(String(255), nullable=True)
    function = Column(String(255), nullable=True)
    range = Column(String(255), nullable=True)
    output = Column(String(255), nullable=True)
    voltage = Column(String(255), nullable=True)
    connection = Column(String(255), nullable=True)
    material = Column(String(255), nullable=True)
    images = Column(String(255), nullable=True)
    pdf = Column(String(255), nullable=True)

# Create tables (only needed once)
Base.metadata.create_all(bind=engine)

# Dependency for DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic Models for Request/Response
class ProductBase(BaseModel):
    code: Optional[str]
    main_cat: Optional[str]
    sub_cat: Optional[str]
    brand: Optional[str]
    model: Optional[str]
    housing_size: Optional[str]
    function: Optional[str]
    range: Optional[str]
    output: Optional[str]
    voltage: Optional[str]
    connection: Optional[str]
    material: Optional[str]
    images: Optional[str]
    pdf: Optional[str]

class ProductResponse(ProductBase):
    id: int

    class Config:
        orm_mode = True

class ProductUpdate(ProductBase):
    pass

# API Endpoints
@app.get("/products", response_model=List[ProductResponse])
def get_all_products(
    limit: int = Query(10, description="Number of products per page", ge=1), 
    offset: int = Query(0, description="Offset for pagination", ge=0),
    db: Session = Depends(get_db)
):
    """
    Fetch products with pagination.
    - limit: max number of products to return
    - offset: skip this many products
    """
    # Query the database with limit and offset
    products = db.query(Product).order_by(asc(Product.id)).offset(offset).limit(limit).all()
    return products

@app.get("/products/{product_id}", response_model=ProductResponse)
def get_product_by_id(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@app.get("/products/code/{code}", response_model=List[ProductResponse])
def get_products_by_code(code: str, db: Session = Depends(get_db)):
    products = db.query(Product).filter(Product.code == code).all()
    if not products:
        raise HTTPException(status_code=404, detail="No products found with this code")
    return products

@app.delete("/products/{product_id}")
def delete_product_by_id(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return {"detail": "Product deleted successfully"}

@app.put("/products/{product_id}", response_model=ProductResponse)
def update_product_by_id(product_id: int, product_update: ProductUpdate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    for key, value in product_update.dict(exclude_unset=True).items():
        setattr(product, key, value)
    db.commit()
    db.refresh(product)
    return product


# Pydantic Model for Add Product
class ProductCreate(BaseModel):
    code: Optional[str]
    main_cat: Optional[str]
    sub_cat: Optional[str]
    brand: Optional[str]
    model: Optional[str]
    housing_size: Optional[str]
    function: Optional[str]
    range: Optional[str]
    output: Optional[str]
    voltage: Optional[str]
    connection: Optional[str]
    material: Optional[str]
    images: Optional[str]
    pdf: Optional[str]

# Add Product API
@app.post("/products", response_model=dict)
def add_product(product: ProductCreate, db: Session = Depends(get_db)):
    # Create a new Product instance
    new_product = Product(
        code=product.code,
        main_cat=product.main_cat,
        sub_cat=product.sub_cat,
        brand=product.brand,
        model=product.model,
        housing_size=product.housing_size,
        function=product.function,
        range=product.range,
        output=product.output,
        voltage=product.voltage,
        connection=product.connection,
        material=product.material,
        images=product.images,
        pdf=product.pdf,
    )

    # Add and commit to the database
    db.add(new_product)
    db.commit()
    db.refresh(new_product)  # Retrieve the new row

    return {"message": "Product added successfully", "id": new_product.id}


@app.get("/distinct-categories", response_model=dict)
def get_distinct_categories(db: Session = Depends(get_db)):
    """
    Fetch distinct values for main_cat, sub_cat, and brand.
    """
    try:
        # Query distinct values
        distinct_main_cat = db.query(Product.main_cat).distinct().all()
        distinct_sub_cat = db.query(Product.sub_cat).distinct().all()
        distinct_brand = db.query(Product.brand).distinct().all()

        # Convert tuples to a flat list
        main_cat_list = sorted([item[0] for item in distinct_main_cat if item[0] is not None])
        sub_cat_list = sorted([item[0] for item in distinct_sub_cat if item[0] is not None])
        brand_list = sorted([item[0] for item in distinct_brand if item[0] is not None])

        return {
            "main_categories": main_cat_list,
            "sub_categories": sub_cat_list,
            "brands": brand_list,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@app.get("/search-products", response_model=List[ProductResponse])
def search_products(
    brand: Optional[str] = None,
    sub_cat: Optional[str] = None,
    main_cat: Optional[str] = None,
    limit: int = Query(10, description="Number of products per page", ge=1),
    offset: int = Query(0, description="Number of products to skip for pagination", ge=0),
    db: Session = Depends(get_db),
):
    """
    Search products based on optional filters: brand, sub_cat, and main_cat.
    If a filter is not provided, it will be ignored in the query.
    Pagination is implemented using limit and offset.
    """
    try:
        query = db.query(Product)

        # Apply filters if they are provided
        if brand:
            query = query.filter(Product.brand == brand)
        if sub_cat:
            query = query.filter(Product.sub_cat == sub_cat)
        if main_cat:
            query = query.filter(Product.main_cat == main_cat)

        # Apply sorting and pagination
        products = query.order_by(asc(Product.id)).offset(offset).limit(limit).all()

        return products
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@app.get("/search-by-model", response_model=ProductResponse)
def search_by_model(
    model: str,
    db: Session = Depends(get_db),
):
    """
    Search for a product by its model and return the first matching result.
    """
    try:
        # Query the database for the first product matching the model
        product = db.query(Product).filter(Product.model == model).first()

        # Handle the case where no product is found
        if not product:
            raise HTTPException(status_code=404, detail="Product with the specified model not found")

        return product
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

