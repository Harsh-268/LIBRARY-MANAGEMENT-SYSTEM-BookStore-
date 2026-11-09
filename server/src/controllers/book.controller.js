import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import { Book } from "../models/book.model.js";
import { Issue } from "../models/issue.model.js";
import apiResponse from "../utils/apiResponse.js";
import mongoose from "mongoose";
import axios from "axios";
import { paginate } from "../utils/paginate.js";


const adjustStockInternal = async (bookId, amount) => {
    // try {
        if(amount === 0){
            throw new apiError(400,"Please provide an appropriate amount of copies")
        }
        const session=await mongoose.startSession();
        session.startTransaction();
        try {
            const book = await Book.findOneAndUpdate(
                {_id:bookId},
                {$inc: { totalCopies: amount, availableCopies: amount }},
                { session,new: true,runValidators: true }
            );
            if (!book){
                throw new apiError(404,"Book not found")
            }
            if(book.availableCopies < 0 || book.totalCopies < 0){
                await session.abortTransaction();
                throw new apiError(400,"Cannot update stock, would result in negative copies")
            }
            await session.commitTransaction();
             return book;
        
        } catch (error) {
            if(session.inTransaction()){
            await session.abortTransaction();
            }
            if(error instanceof apiError){
                throw error
            }
            throw new apiError(500,`Error adjusting book stock:  ${error.message}`);
        }finally{
            session.endSession();
        }
    
        // book.totalCopies += amount;
        // book.availableCopies += amount; 

        // if(book.totalCopies < 0|| book.availableCopies < 0)
        // {return null}

        // await book.save({ validateBeforeSave: false });
       
    // } catch (error) {
    //     throw new apiError(400,"Error adjusting book stock: ", error);
    // }
};


//Admin controllers
const searchBooksByISBN = asyncHandler(async (req, res) => {
    const { isbn } = req.params;

    if (!isbn || isbn.trim() === "") {
        throw new apiError(400, "ISBN is required");
    }

    if (!process.env.GOOGLE_BOOKS_API_KEY) {
        throw new apiError(500, "Google Books API key is not configured on the server");
    }

    try {
        const googleURL = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${process.env.GOOGLE_BOOKS_API_KEY}`;
        const response = await axios.get(googleURL);
        const data = response.data;

        if (!data.items || data.items.length === 0) {
            throw new apiError(404, "No book found with the provided ISBN");
        }

        const books = data.items.map((item) => {
            const info = item.volumeInfo;
            return {
                title: info.title,
                authors: info.authors || ["Unknown Author"],
                description: info.description || "No description available",
                thumbnail: info.imageLinks?.thumbnail || "",
                category: info.categories ? info.categories[0] : "General",
                pageCount: info.pageCount,
                isbn: isbn
            };
        });

        return res
            .status(200)
            .json(new apiResponse(200, books, "Books fetched successfully"));

    } catch (error) {
        if (error.statusCode === 404 || error instanceof apiError) {
            throw error;
        }

        const status = error.response?.status;
        const googleMessage = error.response?.data?.error?.message || error.message;

        console.error("Google Books API error:", status, googleMessage);

        // Quota/rate-limit errors come back as 429 or 403 from Google
        if (status === 429 || status === 403) {
            throw new apiError(
                503,
                "Book lookup service is temporarily unavailable due to rate limits. Please try again shortly, or enter the book details manually."
            );
        }

        throw new apiError(
            500,
            `Failed to fetch book details from Google Books API: ${googleMessage}`
        );
    }
});

const addBookToLibrary = asyncHandler(async (req, res) => {
    const { title,isbn, authors,description,thumbnail,category,pageCount,totalCopies } = req.body;

    const existingBook = await Book.findOne({ isbn });
    if (existingBook) {
        // throw new apiError(409, "Book with this ISBN already exists in the library");
        // Instead of throwing an error, we will update the stock of the existing book
        const updatedBook = await adjustStockInternal(existingBook._id, totalCopies || 1);
        if (!updatedBook) {
            throw new apiError(500, "Something went wrong while updating the existing book's stock");
        }
        return res
        .status(200)
        .json(new apiResponse(200, updatedBook, "Existing book stock updated successfully"));
    }

    const book = await Book.create({
        title,
        authors,
        description,
        thumbnail,
        category,
        pageCount,
        isbn,
        totalCopies:totalCopies || 1,
        availableCopies:totalCopies || 1
    });

    if (!book) {
        throw new apiError(500, "Something went wrong while adding the book to the library");
    }

    return res
    .status(201)
    .json(
        new apiResponse(201, book, "Book added to library successfully")
    );
});

const updateBookDetails = asyncHandler(async (req, res) => {
    const { bookId } = req.params;
    const updates = req.body;

    // if (!mongoose.Types.ObjectId.isValid(bookId)) {
    //     throw new apiError(400, "Invalid book ID");
    // }

    const book = await Book.findByIdAndUpdate(bookId, { $set: updates }, { new: true,runValidators: true });

    if (!book) {
        throw new apiError(400, "Something went wrong while updating book details");
    }

    return res
    .status(200)
    .json(
        new apiResponse(200, book, "Book details updated successfully")
    );
})

const deleteBookFromLibrary = asyncHandler(async (req, res) => {
    const { bookId } = req.params;

    const isIssued= await Issue.findOne({book:bookId,status:"ISSUED"})

    if(isIssued){
        throw new apiError(400,"Cannot delete book as it is currently issued to a user")
    }
    
    const book = await Book.findByIdAndDelete(bookId);

    if (!book) {
        throw new apiError(400, "Something went wrong while deleting the book");
    }

    return res
    .status(200)
    .json(
        new apiResponse(200, book, "Book deleted from library successfully")
    );

})

const updateBookStock = asyncHandler(async (req, res) => {
    const {bookId}= req.params;
    const {changeInCopies}= req.body;

    if(changeInCopies === undefined||isNaN(Number(changeInCopies))){
        throw new apiError(400,"changeInCopies must be a valid number")
    }

    const updatedBook= await adjustStockInternal(bookId,Number(changeInCopies));

    // if(!updatedBook){
    //     throw new apiError(400," Book not found.")
    // }
    
    return res
    .status(200)
    .json(
        new apiResponse(200, updatedBook, "Book stock updated successfully")
    );
})




//user controllers
const getAllBooks = asyncHandler(async (req, res) => {
    const {page,limit}= req.query;

    const {data:books,metadata}= await paginate({
        model:Book,
        page,
        limit,
        sort:{createdAt:-1}
    })

    return res
    .status(200)
    .json(new apiResponse(200,{books,metadata},"Books fetched successfully"))
})
const getBookById = asyncHandler(async (req,res) => {
    const {bookId}= req.params;
    
    // if (!mongoose.Types.ObjectId.isValid(bookId)) {
    //     throw new apiError(400, "Invalid book ID");
    // }
    const book = await Book.findById(bookId);

    if(!book){
        throw new apiError(404,"Book not found")
    }

    return res
    .status(200)
    .json(new apiResponse(200,book,"Book fetched successfully"))
})

const searchLibraryBooks = asyncHandler(async (req,res) => {
    const {q,page,limit}=req.query

    if(!q || q.trim()===""){
        throw new apiError(400,"Search query is required")
    }

    const searchQuery={
        $or:[
            {title:{$regex:q,$options:"i"}},
            {authors:{$regex:q,$options:"i"}},
            {isbn:{$regex:q,$options:"i"}},
        ]
    }
    const {data:books,metadata}= await paginate({
        model:Book,
        query:searchQuery,
        page,
        limit,
        sort:{createdAt:-1}
    })

    return res
    .status(200)
    .json(new apiResponse(200,{books,metadata},"Books found successfully"))
})

const getBooksByCategory= asyncHandler(async (req,res) => {

    const{category}= req.params
    const {page,limit}= req.query
    
    if(!category || category.trim()===""){
        throw new apiError(400,"Category is required for search")
    }
    const searchQuery={
        category:{$regex:category,$options:"i"}
    }

    const {data:books,metadata}= await paginate({
        model:Book,
        query:searchQuery,
        page,
        limit,
        sort:{createdAt:-1}
    })


    return res
    .status(200)
    .json(new apiResponse(200,{books,metadata},"Books fetched successfully"))
})

//user controllers to get top 5 most issued books
const getMostIssuedBooks = asyncHandler(async (req, res) => {
    const topBooks = await Issue.aggregate([
        {
            $group: {
                _id: "$book",
                issueCount: { $sum: 1 }
            }
        },
        { $sort: { issueCount: -1 } },
        { $limit: 5 },
        {
            $lookup: {
                from: "books",
                localField: "_id",
                foreignField: "_id",
                as: "book"
            }
        },
        { $unwind: "$book" },
        {
            $project: {
                _id: "$book._id",
                title: "$book.title",
                authors: "$book.authors",
                thumbnail: "$book.thumbnail",
                description: "$book.description",
                category: "$book.category",
                issueCount: 1
            }
        }
    ]);

    return res
        .status(200)
        .json(new apiResponse(200, topBooks, "Most issued books fetched successfully"));
});

//user controller to get recent 5 added books
const getRecentlyAddedBooks = asyncHandler(async (req, res) => {
    const books = await Book.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("title authors thumbnail description category createdAt");

    return res
        .status(200)
        .json(new apiResponse(200, books, "Recently added books fetched successfully"));
});

export {searchBooksByISBN,addBookToLibrary,getAllBooks,updateBookDetails,deleteBookFromLibrary,updateBookStock,getBookById,getBooksByCategory,searchLibraryBooks,getMostIssuedBooks,getRecentlyAddedBooks};