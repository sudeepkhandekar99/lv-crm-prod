from fastapi import FastAPI, Depends, HTTPException, Query, File, UploadFile, Path
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


class Brand(Base):
    __tablename__ = "brand"

    id = Column(Integer, primary_key=True, index=True)
    brand = Column(String(255), nullable=False)
    display_name = Column(String(255), nullable=False)
    priority = Column(Integer, nullable=False)
    aws_link = Column(Text, nullable=False)


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    main_title = Column(String(255), nullable=False)
    location = Column(String(255), nullable=False)
    subheading = Column(String(255), nullable=False)
    summary = Column(Text, nullable=False)
    image_link = Column(Text, nullable=False)

class ProjectCreate(BaseModel):
    main_title: str
    location: str
    subheading: str
    summary: str
    image_link: str

class ProjectUpdate(BaseModel):
    main_title: Optional[str]
    location: Optional[str]
    subheading: Optional[str]
    summary: Optional[str]
    image_link: Optional[str]

class BrandCreate(BaseModel):
    brand: str
    display_name: str
    priority: int
    aws_link: str

class BrandUpdate(BaseModel):
    brand: Optional[str]
    display_name: Optional[str]
    priority: Optional[int]
    aws_link: Optional[str]


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


class SubCategoryCreate(BaseModel):
    subcat: str
    display_name: str
    priority: int
    link: str

class SubCategoryUpdate(BaseModel):
    subcat: Optional[str]
    display_name: Optional[str]
    priority: Optional[int]
    link: Optional[str]

class SubCategory(Base):
    __tablename__ = "sub_category"

    id = Column(Integer, primary_key=True, index=True)
    subcat = Column(String(255), nullable=False)
    display_name = Column(String(255), nullable=False)
    priority = Column(Integer, nullable=False)
    link = Column(Text, nullable=False)

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


@app.get("/search-by-model", response_model=List[ProductResponse])
def search_by_model(
    model: str,
    db: Session = Depends(get_db),
):
    """
    Search for a product by its model and return the first matching result.
    """
    try:
        # Query the database for the first product matching the model
        product = db.query(Product).filter(Product.model.ilike(f"%{model}%")).all()

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
            code = code.strip()
            filters.append(func.lower(Product.code).ilike(f"%{code.lower()}%"))
        if main_cat:
            main_cat = main_cat.strip()
            filters.append(func.lower(Product.main_cat).ilike(f"%{main_cat.lower()}%"))
        if sub_cat:
            sub_cat = sub_cat.strip()
            filters.append(func.lower(Product.sub_cat).ilike(f"%{sub_cat.lower()}%"))
        if brand:
            brand = brand.strip()
            filters.append(func.lower(Product.brand).ilike(f"%{brand.lower()}%"))
        if model:
            model = model.strip()
            filters.append(func.lower(Product.model).ilike(f"%{model.lower()}%"))
        if housing_size:
            housing_size = housing_size.strip()
            filters.append(func.lower(Product.housing_size).ilike(f"%{housing_size.lower()}%"))
        if function:
            function = function.strip()
            filters.append(func.lower(Product.function).ilike(f"%{function.lower()}%"))
        if range:
            range = range.strip()
            filters.append(func.lower(Product.range).ilike(f"%{range.lower()}%"))
        if output:
            output = output.strip()
            filters.append(func.lower(Product.output).ilike(f"%{output.lower()}%"))
        if voltage:
            voltage = voltage.strip()
            filters.append(func.lower(Product.voltage).ilike(f"%{voltage.lower()}%"))
        if connection:
            connection = connection.strip()
            filters.append(func.lower(Product.connection).ilike(f"%{connection.lower()}%"))
        if material:
            material = material.strip()
            filters.append(func.lower(Product.material).ilike(f"%{material.lower()}%"))

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

def create_subcategory(db: Session, subcategory: SubCategoryCreate):
    db_subcategory = SubCategory(**subcategory.model_dump())
    db.add(db_subcategory)
    db.commit()
    db.refresh(db_subcategory)
    return db_subcategory

def update_subcategory(db: Session, subcategory_id: int, subcategory: SubCategoryUpdate):
    db_subcategory = db.query(SubCategory).filter(SubCategory.id == subcategory_id).first()
    if not db_subcategory:
        return None
    for key, value in subcategory.model_dump(exclude_unset=True).items():
        setattr(db_subcategory, key, value)
    db.commit()
    db.refresh(db_subcategory)
    return db_subcategory

def delete_subcategory(db: Session, subcategory_id: int):
    db_subcategory = db.query(SubCategory).filter(SubCategory.id == subcategory_id).first()
    if not db_subcategory:
        return None
    db.delete(db_subcategory)
    db.commit()
    return db_subcategory

def get_subcategory(db: Session, subcategory_id: int):
    return db.query(SubCategory).filter(SubCategory.id == subcategory_id).first()

def get_all_subcategories(db: Session):
    return db.query(SubCategory).all()

@app.post("/subcategories")
def create_new_subcategory(subcategory: SubCategoryCreate, db: Session = Depends(get_db)):
    return create_subcategory(db, subcategory)

@app.put("/subcategories/{subcategory_id}")
def update_existing_subcategory(subcategory_id: int, subcategory: SubCategoryUpdate, db: Session = Depends(get_db)):
    updated_subcategory = update_subcategory(db, subcategory_id, subcategory)
    if not updated_subcategory:
        raise HTTPException(status_code=404, detail="Subcategory not found")
    return updated_subcategory

@app.delete("/subcategories/{subcategory_id}")
def delete_existing_subcategory(subcategory_id: int, db: Session = Depends(get_db)):
    deleted_subcategory = delete_subcategory(db, subcategory_id)
    if not deleted_subcategory:
        raise HTTPException(status_code=404, detail="Subcategory not found")
    return {"message": "Subcategory deleted successfully"}

@app.get("/subcategories/{subcategory_id}")
def read_subcategory(subcategory_id: int, db: Session = Depends(get_db)):
    subcategory = get_subcategory(db, subcategory_id)
    if not subcategory:
        raise HTTPException(status_code=404, detail="Subcategory not found")
    return subcategory

@app.get("/subcategories")
def read_all_subcategories(db: Session = Depends(get_db)):
    return get_all_subcategories(db)


@app.get("/products/distinct-sub-categories/{main_cat}")
def get_distinct_sub_category_details(
    main_cat: str = Path(..., description="The main category to filter subcategories"),
    db: Session = Depends(get_db),
):
    """
    Get the details of all subcategories in the `sub_category` table where
    `subcat` matches the distinct `sub_cat` values filtered by `main_cat` from the `products` table.
    """
    try:
        # Query distinct sub_cat values for the given main_cat from the `products` table
        distinct_sub_cats = (
            db.query(Product.sub_cat)
            .filter(func.lower(Product.main_cat) == main_cat.lower())
            .distinct()
            .all()
        )

        # Flatten results to a simple list of strings
        sub_cat_list = [item[0] for item in distinct_sub_cats if item[0] is not None]

        # Query the `sub_category` table for matching subcategories
        sub_category_details = (
            db.query(SubCategory)
            .filter(SubCategory.subcat.in_(sub_cat_list))
            .all()
        )

        # Serialize results
        result = [
            {
                "id": sub_category.id,
                "subcat": sub_category.subcat,
                "display_name": sub_category.display_name,
                "priority": sub_category.priority,
                "link": sub_category.link,
            }
            for sub_category in sub_category_details
        ]

        return {"main_category": main_cat, "sub_categories": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


def create_brand(db: Session, brand: BrandCreate):
    db_brand = Brand(**brand.model_dump())
    db.add(db_brand)
    db.commit()
    db.refresh(db_brand)
    return db_brand

def update_brand(db: Session, brand_id: int, brand: BrandUpdate):
    db_brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not db_brand:
        return None
    for key, value in brand.model_dump(exclude_unset=True).items():
        setattr(db_brand, key, value)
    db.commit()
    db.refresh(db_brand)
    return db_brand

def delete_brand(db: Session, brand_id: int):
    db_brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not db_brand:
        return None
    db.delete(db_brand)
    db.commit()
    return db_brand

def get_brand(db: Session, brand_id: int):
    return db.query(Brand).filter(Brand.id == brand_id).first()

def get_all_brands(db: Session):
    return db.query(Brand).all()

@app.post("/brands")
def create_new_brand(brand: BrandCreate, db: Session = Depends(get_db)):
    """
    Create a new brand.
    """
    return create_brand(db, brand)

@app.put("/brands/{brand_id}")
def update_existing_brand(brand_id: int, brand: BrandUpdate, db: Session = Depends(get_db)):
    """
    Update an existing brand by ID.
    """
    updated_brand = update_brand(db, brand_id, brand)
    if not updated_brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    return updated_brand

@app.delete("/brands/{brand_id}")
def delete_existing_brand(brand_id: int, db: Session = Depends(get_db)):
    """
    Delete a brand by ID.
    """
    deleted_brand = delete_brand(db, brand_id)
    if not deleted_brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    return {"message": "Brand deleted successfully"}

@app.get("/brands/{brand_id}")
def read_brand(brand_id: int, db: Session = Depends(get_db)):
    """
    Get a single brand by ID.
    """
    brand = get_brand(db, brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    return brand

@app.get("/brands")
def read_all_brands(db: Session = Depends(get_db)):
    """
    Get all brands.
    """
    return get_all_brands(db)


@app.get("/products/unique_brands/{main_cat}/{sub_cat}")
def get_brands_by_main_cat_and_sub_cat(
    main_cat: str = Path(..., description="Main category to filter products"),
    sub_cat: str = Path(..., description="Subcategory to filter products"),
    db: Session = Depends(get_db),
):
    """
    Query the products table by main_cat and sub_cat to retrieve all distinct brands
    and match them with brand details from the brand table.
    """
    try:
        # Step 1: Query distinct brands from the products table
        distinct_brands = (
            db.query(Product.brand)
            .filter(func.lower(Product.main_cat) == main_cat.lower())
            .filter(func.lower(Product.sub_cat) == sub_cat.lower())
            .distinct()
            .all()
        )

        # Flatten the result to a simple list of brand names
        brand_names = [item[0] for item in distinct_brands if item[0] is not None]

        # Step 2: Query the brand table to get details for the matched brands
        if brand_names:
            brand_details = (
                db.query(Brand)
                .filter(or_(*[Brand.brand.like(f"%{name}%") for name in brand_names]))
                .all()
            )

            # Serialize the brand details
            result = [
                {
                    "id": brand.id,
                    "brand": brand.brand,
                    "display_name": brand.display_name,
                    "priority": brand.priority,
                    "aws_link": brand.aws_link,
                }
                for brand in brand_details
            ]
        else:
            result = []

        return {
            "main_category": main_cat,
            "sub_category": sub_cat,
            "brands": result,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
    
def create_project(db: Session, project: ProjectCreate):
    db_project = Project(**project.model_dump())
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

def update_project(db: Session, project_id: int, project: ProjectUpdate):
    db_project = db.query(Project).filter(Project.id == project_id).first()
    if not db_project:
        return None
    for key, value in project.model_dump(exclude_unset=True).items():
        setattr(db_project, key, value)
    db.commit()
    db.refresh(db_project)
    return db_project

def delete_project(db: Session, project_id: int):
    db_project = db.query(Project).filter(Project.id == project_id).first()
    if not db_project:
        return None
    db.delete(db_project)
    db.commit()
    return db_project

def get_project(db: Session, project_id: int):
    return db.query(Project).filter(Project.id == project_id).first()

def get_all_projects(db: Session):
    return db.query(Project).all()

@app.post("/projects")
def create_new_project(project: ProjectCreate, db: Session = Depends(get_db)):
    """
    Create a new project.
    """
    return create_project(db, project)

@app.put("/projects/{project_id}")
def update_existing_project(project_id: int, project: ProjectUpdate, db: Session = Depends(get_db)):
    """
    Update an existing project by ID.
    """
    updated_project = update_project(db, project_id, project)
    if not updated_project:
        raise HTTPException(status_code=404, detail="Project not found")
    return updated_project

@app.delete("/projects/{project_id}")
def delete_existing_project(project_id: int, db: Session = Depends(get_db)):
    """
    Delete a project by ID.
    """
    deleted_project = delete_project(db, project_id)
    if not deleted_project:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted successfully"}

@app.get("/projects/{project_id}")
def read_project(project_id: int, db: Session = Depends(get_db)):
    """
    Get a single project by ID.
    """
    project = get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@app.get("/projects")
def read_all_projects(db: Session = Depends(get_db)):
    """
    Get all projects.
    """
    return get_all_projects(db)


# client model
class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    link = Column(Text, nullable=False)
    priority = Column(Integer, nullable=False, default=1)


# client request and response schemas
class ClientBase(BaseModel):
    name: str
    link: str
    priority: Optional[int] = 1  # Default value is 1

class ClientCreate(ClientBase):
    pass  # Used for creating new clients

class ClientUpdate(BaseModel):
    name: Optional[str]
    link: Optional[str]
    priority: Optional[int]

class ClientResponse(ClientBase):
    id: int

    class Config:
        from_attributes = True

# client apis
@app.get("/clients", response_model=List[ClientResponse])
def get_all_clients(db: Session = Depends(get_db)):
    """
    Retrieve all clients.
    """
    clients = db.query(Client).order_by(asc(Client.priority)).all()
    return clients

@app.get("/clients/{client_id}", response_model=ClientResponse)
def get_client_by_id(client_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a single client by ID.
    """
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client

@app.put("/clients/{client_id}", response_model=ClientResponse)
def update_client_by_id(client_id: int, client_update: ClientUpdate, db: Session = Depends(get_db)):
    """
    Update an existing client by ID.
    """
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    for key, value in client_update.dict(exclude_unset=True).items():
        setattr(client, key, value)

    db.commit()
    db.refresh(client)
    return client

@app.delete("/clients/{client_id}")
def delete_client_by_id(client_id: int, db: Session = Depends(get_db)):
    """
    Delete a client by ID.
    """
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    db.delete(client)
    db.commit()
    return {"message": "Client deleted successfully"}

@app.post("/clients", response_model=ClientResponse)
def create_client(client: ClientCreate, db: Session = Depends(get_db)):
    """
    Create a new client.
    """
    new_client = Client(
        name=client.name,
        link=client.link,
        priority=client.priority
    )

    db.add(new_client)
    db.commit()
    db.refresh(new_client)

    return new_client