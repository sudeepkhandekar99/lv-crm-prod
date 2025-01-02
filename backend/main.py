from fastapi import FastAPI, Depends, HTTPException, Query, File, UploadFile
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException
from sqlalchemy import create_engine, Column, Integer, String, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import asc ,or_, func, and_

from dotenv import load_dotenv
import os
import boto3
from botocore.exceptions import ClientError
from datetime import datetime
from urllib.parse import urlparse
import csv
import requests


app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (or specify a list of allowed origins)
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# Load environment variables from .env file
load_dotenv()

# Access the DATABASE_URL variable
DATABASE_URL = os.getenv("DATABASE_URL")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION")

# AWS S3 Configuration
AWS_BUCKET_NAME = os.getenv("AWS_BUCKET_NAME")
AWS_REGION = os.getenv("AWS_REGION")
S3_CLIENT = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_REGION
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


class ProductResponse(BaseModel):
    id: int
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

    class Config:
        from_attributes = True

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
        from_attributes = True

class ProductUpdate(ProductBase):
    pass

class Category(Base):
    __tablename__ = "category"

    id = Column(Integer, primary_key=True, index=True)
    main_category = Column(String(255), nullable=False)
    display_name = Column(String(255), nullable=False)
    priority = Column(Integer, nullable=False)
    image_link = Column(Text, nullable=False)


class CategoryBase(BaseModel):
    main_category: str
    display_name: str
    priority: int
    image_link: str

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    main_category: Optional[str]
    display_name: Optional[str]
    priority: Optional[int]
    image_link: Optional[str]

class CategoryResponse(CategoryBase):
    id: int

    class Config:
        from_attributes = True

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


@app.post("/upload-product-image")
async def upload_image(file: UploadFile = File(...)):
    try:
        # Generate a unique file key using timestamp
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        file_key = f"product_images/{timestamp}_{file.filename}"

        # Upload the file to S3
        S3_CLIENT.upload_fileobj(
            file.file, AWS_BUCKET_NAME, file_key,
            ExtraArgs={"ContentType": file.content_type}
        )
        # Generate the file's URL
        file_url = f"https://{AWS_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{file_key}"

        return {"message": "Image uploaded successfully", "url": file_url}
    except ClientError as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")


@app.delete("/delete-image")
async def delete_image(file_url: str = Query(...)):
    try:
        # Extract the file key (path after the bucket name) from the URL
        parsed_url = urlparse(file_url)
        file_key = parsed_url.path.lstrip("/")  # Remove leading "/"

        # Delete the file from S3
        S3_CLIENT.delete_object(Bucket=AWS_BUCKET_NAME, Key=file_key)
        return {"message": f"Image '{file_key}' deleted successfully"}
    except ClientError as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete image: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")


@app.put("/process-links")
async def process_links():
    session = SessionLocal()
    updated_rows = []

    try:
        products = session.query(Product).all()
        if not products:
            return {"message": "No products found in the database"}

        for product in products:
            updated = False

            # Process image link
            if product.images:
                new_image_url = download_and_upload_to_s3(product.images, "images")
                if new_image_url and new_image_url != product.images:
                    print(f"Updated image URL for product ID {product.id}")
                    product.images = new_image_url
                    updated = True

            # Process PDF link
            if product.pdf:
                new_pdf_url = download_and_upload_to_s3(product.pdf, "pdfs")
                if new_pdf_url and new_pdf_url != product.pdf:
                    print(f"Updated PDF URL for product ID {product.id}")
                    product.pdf = new_pdf_url
                    updated = True

            if updated:
                updated_rows.append(product)

        # Commit changes to the database
        session.commit()

        # Save updated rows to a CSV file
        csv_file_path = save_to_csv(updated_rows)
        return {"message": "Links processed successfully", "csv_file": csv_file_path}

    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Error processing links: {e}")
    finally:
        session.close()


def download_and_upload_to_s3(link, folder):
    try:
        # Extract Google Drive file ID
        if "drive.google.com" in link:
            file_id = extract_google_drive_id(link)
            if not file_id:
                return None
            download_url = f"https://drive.google.com/uc?export=download&id={file_id}"
        else:
            download_url = link

        # Download the file
        response = requests.get(download_url, stream=True)
        if response.status_code != 200:
            return None

        # Generate a unique file key using current timestamp
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        _, file_extension = os.path.splitext(link)
        file_key = f"{folder}/{timestamp}{file_extension}"

        # Upload to S3 without ACL
        S3_CLIENT.upload_fileobj(
            response.raw,
            AWS_BUCKET_NAME,
            file_key,
            ExtraArgs={"ContentType": response.headers.get("Content-Type", "application/octet-stream")}
        )

        # Return the S3 URL
        return f"https://{AWS_BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/{file_key}"

    except Exception as e:
        print(f"Failed to process link: {link}. Error: {e}")
        return None


def extract_google_drive_id(link):
    try:
        if "id=" in link:
            return link.split("id=")[1].split("&")[0]
        elif "/d/" in link:
            return link.split("/d/")[1].split("/")[0]
        return None
    except Exception as e:
        print(f"Error extracting file ID from link: {link}. Error: {e}")
        return None


def save_to_csv(rows):
    csv_file_path = "updated_products.csv"
    with open(csv_file_path, mode="w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        # Write header
        writer.writerow(["id", "code", "main_cat", "sub_cat", "brand", "model", "housing_size", "function", "range", "output", "voltage", "connection", "material", "images", "pdf"])
        # Write rows
        for row in rows:
            writer.writerow([row.id, row.code, row.main_cat, row.sub_cat, row.brand, row.model, row.housing_size, row.function, row.range, row.output, row.voltage, row.connection, row.material, row.images, row.pdf])
    return csv_file_path


@app.get("/distinct-values", response_model=dict)
def get_distinct_values(db: Session = Depends(get_db)):
    """
    Fetch distinct values for all fields in the Product table.
    """
    try:
        # Query distinct values for each field
        distinct_values = {
            "code": sorted([item[0] for item in db.query(Product.code).distinct().all() if item[0] is not None]),
            "main_categories": sorted([item[0] for item in db.query(Product.main_cat).distinct().all() if item[0] is not None]),
            "sub_categories": sorted([item[0] for item in db.query(Product.sub_cat).distinct().all() if item[0] is not None]),
            "brands": sorted([item[0] for item in db.query(Product.brand).distinct().all() if item[0] is not None]),
            "models": sorted([item[0] for item in db.query(Product.model).distinct().all() if item[0] is not None]),
            "housing_sizes": sorted([item[0] for item in db.query(Product.housing_size).distinct().all() if item[0] is not None]),
            "functions": sorted([item[0] for item in db.query(Product.function).distinct().all() if item[0] is not None]),
            "ranges": sorted([item[0] for item in db.query(Product.range).distinct().all() if item[0] is not None]),
            "outputs": sorted([item[0] for item in db.query(Product.output).distinct().all() if item[0] is not None]),
            "voltages": sorted([item[0] for item in db.query(Product.voltage).distinct().all() if item[0] is not None]),
            "connections": sorted([item[0] for item in db.query(Product.connection).distinct().all() if item[0] is not None]),
            "materials": sorted([item[0] for item in db.query(Product.material).distinct().all() if item[0] is not None]),
        }

        return distinct_values
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
    

@app.get("/search-products-extended", response_model=dict)
def search_products(
    code: Optional[str] = None,
    main_cat: Optional[str] = None,
    sub_cat: Optional[str] = None,
    brand: Optional[str] = None,
    model: Optional[str] = None,
    housing_size: Optional[str] = None,
    function: Optional[str] = None,
    range: Optional[str] = None,
    output: Optional[str] = None,
    voltage: Optional[str] = None,
    connection: Optional[str] = None,
    material: Optional[str] = None,
    page: int = Query(1, description="Page number for pagination", ge=1),
    db: Session = Depends(get_db),
):
    """
    Search products with optional filters, and return paginated results.
    """
    try:
        PAGE_SIZE = 16  # Items per page
        offset = (page - 1) * PAGE_SIZE

        query = db.query(Product)

        # Apply dynamic filters
        filters = []
        if code:
            filters.append(func.lower(Product.code).like(f"%{code.lower()}%"))
        if main_cat:
            filters.append(func.lower(Product.main_cat).like(f"%{main_cat.lower()}%"))
        if sub_cat:
            filters.append(func.lower(Product.sub_cat).like(f"%{sub_cat.lower()}%"))
        if brand:
            filters.append(func.lower(Product.brand).like(f"%{brand.lower()}%"))
        if model:
            filters.append(func.lower(Product.model).like(f"%{model.lower()}%"))
        if housing_size:
            filters.append(func.lower(Product.housing_size).like(f"%{housing_size.lower()}%"))
        if function:
            filters.append(func.lower(Product.function).like(f"%{function.lower()}%"))
        if range:
            filters.append(func.lower(Product.range).like(f"%{range.lower()}%"))
        if output:
            filters.append(func.lower(Product.output).like(f"%{output.lower()}%"))
        if voltage:
            filters.append(func.lower(Product.voltage).like(f"%{voltage.lower()}%"))
        if connection:
            filters.append(func.lower(Product.connection).like(f"%{connection.lower()}%"))
        if material:
            filters.append(func.lower(Product.material).like(f"%{material.lower()}%"))

        if filters:
            query = query.filter(and_(*filters))

        # Pagination and sorting
        total_items = query.count()
        products = query.order_by(asc(Product.id)).offset(offset).limit(PAGE_SIZE).all()

        # Convert SQLAlchemy objects to Pydantic models
        product_responses = [ProductResponse.from_orm(product) for product in products]

        return {
            "page": page,
            "page_size": PAGE_SIZE,
            "total_items": total_items,
            "total_pages": (total_items + PAGE_SIZE - 1) // PAGE_SIZE,
            "products": product_responses,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@app.post("/categories")
def create_category(db: Session = Depends(get_db), category: CategoryCreate = None):
    db_category = Category(**category.model_dump())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return {"message": "Category created successfully", "category": db_category}

@app.put("/categories/{category_id}")
def update_category(db: Session = Depends(get_db), category_id: int = None, category: CategoryUpdate = None):
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if not db_category:
        return {"error": "Category not found"}
    for key, value in category.model_dump(exclude_unset=True).items():
        setattr(db_category, key, value)
    db.commit()
    db.refresh(db_category)
    return {"message": "Category updated successfully", "category": db_category}

@app.delete("/categories/{category_id}")
def delete_category(db: Session = Depends(get_db), category_id: int = None):
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if not db_category:
        return {"error": "Category not found"}
    db.delete(db_category)
    db.commit()
    return {"message": "Category deleted successfully"}

@app.get("/categories/{category_id}")
def get_category(db: Session = Depends(get_db), category_id: int = None):
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if not db_category:
        return {"error": "Category not found"}
    return db_category

@app.get("/categories")
def get_all_categories(db: Session = Depends(get_db)):
    return db.query(Category).all()

