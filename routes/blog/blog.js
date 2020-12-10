const router = require('express').Router()
const methods = require('../../middlewares/methods')
const verify = require('../../middlewares/verifyToken')
const {
    serverError
} = require('../../utils/errors')
const {
    idValidation,getFilteredBlogsValidation
} = require('../../utils/validation')
const Blog = require('../../model/blog')
const smartSearch = require('../../utils/smartSearch')

router.all("/filter",methods(['POST']))
router.post("/filter", async (req, res) => {
    if (getFilteredBlogsValidation(req, res)) return
    try {
        const blogs = await Blog.find({
            ...req.body.filters
        }).limit(req.body.limit).sort(req.body.sortBy)
        if (req.body.query) {
            const searchResults = smartSearch(req.body.query, blogs, ['name', 'description'])
            return res.send({
                message: 'FItlered blogs retrieved successfully',
                count: searchResults.length,
                blogs: searchResults
            })
        }
        return res.send({
            message: 'Filtered blogs retrieved successfully',
            count: blogs.length,
            blogs: blogs
        })

    } catch (err) {
        serverError(res, err)
    }
})
router.all("/:id", methods(['GET']))
router.get("/:id", async (req, res) => {
    if (idValidation(req, res)) return
    try {
        const blog = await Blog.findById(req.params.id)
        if (!blog) return notFound(res, 'Blog')
        blog.viewCount += 1
        await blog.save()
        return res.send({
            message: 'Blog retrieved successfully',
            blog: blog
        })
    } catch (err) {
        serverError(res, err)
    }
})
router.all("/",methods(['GET']))
router.get("/",async (req,res) =>
{
    try {
        const blogs = await Blog.find({})
        return res.send({
            message:'Blogs retrieved successfully',
            count:blogs.length,
            blogs:blogs
        })   
    }
    catch(err) {
        serverError(res,err)
    }
})

module.exports = router


//TODO test blog a hodit ho na terramiu