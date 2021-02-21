const methods = require('../../middlewares/methods')
const verify = require('../../middlewares/verifyToken')
const {
    idValidation,
    createBlogValidation,
    patchBlogValidation
} = require('../../utils/validation')
const {
    serverError,
    notFound
} = require('../../utils/errors')
const Blog = require('../../model/blog')
const sanitizeHtml = require('sanitize-html');
const {resizeImage,unlinkIfRedundant} = require('../../utils/files')
const upload = require('../../utils/multerConfig')

const sanitizeOptions = {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'img' ]),
    allowedAttributes: {
        a: [ 'href', 'name', 'target' ],
        img: [ 'src' ],
        '*' : [ 'style' ]
      }
  }

module.exports = (router) => {
    router.all("/blogs", methods(['POST']))
    router.post("/blogs", verify(1), async (req, res) => {
        if (createBlogValidation(req, res)) return
        try {
            req.body.html = sanitizeHtml(req.body.html,sanitizeOptions)
            const blog = new Blog({
                ...req.body
            })
            await blog.save()
            return res.send({
                message: 'New blog created successfully',
                blog: blog
            })
        } catch (err) {
            serverError(res, err)
        }
    })

    router.all("/blogs/:id", methods(['PATCH']))
    router.patch("/blogs/:id", verify(1), async (req, res) => {
        if (idValidation(req, res)) return
        try {
            if (req.body.html){
            req.body.html = sanitizeHtml(req.body.html,sanitizeOptions)
            }
            //MARK dat do ifu a dat prec fbiau
            await Blog.findByIdAndUpdate(req.params.id, {
                ...req.body
            })
            const blog = await Blog.findById(req.params.id)
            return res.send({
                message: 'success',
                blog: blog
            })
        } catch (err) {
            serverError(res, err)
        }
    })
    router.all("/blogs/:id/image",methods(['POST']))
    router.post("/blogs/:id/image",[verify(1), upload.single('blogImage')],async (req,res) =>
    {
        //MARK
        if (!req.file) {
            return res.status(400).send({
                message: 'The file provided was invalid',
                error: 'invalid-file'
            })
        }
        try {
            const blog = await Blog.findById(req.params.id)
            if (!blog) {
                unlinkIfRedundant(req.file.filename)
                return notFound(res,'Blog')
            }
            unlinkIfRedundant(blog.imagePath)
            blog.imagePath = req.file.filename
            resizeImage(req.file.filename)
            blog.save()
            res.send({
                message: 'Image added successfully'
            })
        }
        catch(err) {
            serverError(res,err)
            unlinkIfRedundant(req.file.filename)
        }
    })
}