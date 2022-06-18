const express = require('express')
const app = express()
const port = 5600 || process.env.PORT
const multer = require('multer')
const bodyParser = require('body-parser')
const fs = require('fs')
const path = require('path')
const sizeOf = require('image-size')
const sharp = require('sharp');
const url = `http:127.0.0.1:5600`
const open = require('open');
const DIG = require("discord-image-generation");
const fetch = require('node-fetch')
let width
let height
let filter
let format

let object = {}

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(express.static("public"));


var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public");
    },
    filename: function (req, file, cb) {
        cb(
            null,
            file.fieldname + "-" + Date.now() + path.extname(file.originalname)
        );
    },
});

const imageFilter = function (req, file, cb) {
    if (
        file.mimetype == "image/png" ||
        file.mimetype == "image/jpg" ||
        file.mimetype == "image/jpeg"
    ) {
        cb(null, true);
    } else {
        cb(null, false);
        return cb(new Error("Only .png, .jpg and .jpeg format allowed!"));
    }
};

var upload = multer({ storage: storage, fileFilter: imageFilter });

app.get('/', async (req, res) => {
    res.sendFile(__dirname + '/index.html')
})

function getdimensions(req) {
    if (req.body.width.length == 0) width = sizeOf(req.file.path).width
    else width = parseInt(req.body.width)
    if (req.body.height.length == 0) height = sizeOf(req.file.path).height
    else height = parseInt(req.body.height)
    return { width: width, height: height }
}

app.post('/upload', upload.single('file'), async (req, res) => {
    let dimensions = getdimensions(req)
    filter = req.body.filter
    format = req.body.format
    let outputFilePath = Date.now() + "output." + format;
    if (filter === 'sepia') {
        let img = await new DIG.Sepia().getImage(`http://localhost:5600/getimage/${req.file.path.replace("public\\", "")}`)
        sharp(img)
            .resize(dimensions.width, dimensions.height)
            .toBuffer()
            .then(data => {
                object[req.file.path] = data
            })
        await open(`http://127.0.0.1:5600/output/?id=${req.file.path.replace('.png', '').replace('.jpg', '').replace('.webp', '')}&dlfrm=${req.file.mimetype.replace(`image/`, "").replace('jpeg', 'jpg')}`);
        return res.redirect(`/`)
    }
    if (filter === 'grayscale') {
        let img = await new DIG.Greyscale().getImage(`http://localhost:5600/getimage/${req.file.path.replace("public\\", "")}`)
        sharp(img)
            .resize(dimensions.width, dimensions.height)
            .toBuffer()
            .then(data => {
                object[req.file.path] = data
            })
        await open(`http://127.0.0.1:5600/output/?id=${req.file.path.replace('.png', '').replace('.jpg', '').replace('.webp', '')}&dlfrm=${req.file.mimetype.replace(`image/`, "").replace('jpeg', 'jpg')}`);
        return res.redirect(`/`)
    }
    if (filter === 'inverted') {
        let img = await new DIG.Invert().getImage(`http://localhost:5600/getimage/${req.file.path.replace("public\\", "")}`)
        sharp(img)
            .resize(dimensions.width, dimensions.height)
            .toBuffer()
            .then(data => {
                object[req.file.path] = data
            })
        await open(`http://127.0.0.1:5600/output/?id=${req.file.path.replace('.png', '').replace('.jpg', '').replace('.webp', '')}&dlfrm=${req.file.mimetype.replace(`image/`, "").replace('jpeg', 'jpg')}`);
        return res.redirect(`/`)
    }
    if (filter === 'none') {
        let img = await fetch(`http://localhost:5600/getimage/${req.file.path.replace("public\\", "")}`)
        img = await img.buffer()
        sharp(img)
            .resize(dimensions.width, dimensions.height)
            .toBuffer()
            .then(data => {
                object[req.file.path] = data
            })
        console.log(req.file.path)
        await open(`http://127.0.0.1:5600/output/?id=${req.file.path.replace('.png', '').replace('.jpg', '').replace('.webp', '')}&dlfrm=${req.file.mimetype.replace(`image/`, "").replace('jpeg', 'jpg')}`);
        return res.redirect(`/`)
    }
})

app.listen(port, async (req, res) => {
    console.log(`Listening to ${port}`)
})

app.get('/getimage/:id', async (req, res) => {
    fs.readFile(`${process.cwd()}/public/${req.params.id}`, (err, data) => {
        res.set(`Content-Type`, `image/png`)
        res.end(data)
    })
})

app.get(`/output`, async (req, res) => {
    console.log(format)
    res.set(`Content-Type`, `image/${format}`)
    res.end(object[req.query.id+'.'+req.query.dlfrm])
    fs.unlinkSync(req.query.id+'.'+req.query.dlfrm)
})

process.on('uncaughtException', (error) => {
    console.log(error)
})

process.on('unhandledRejection', (error, p) => {
    console.log(error)
})

app.get('/About', async (req, res) => {
    res.sendFile(__dirname+'/About.html')
})