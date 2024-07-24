const cloudinary = require("cloudinary").v2; 

exports.cloudinaryConnect = () => {
    console.log("Connecting to cloudinary");
	try {
		cloudinary.config({
			cloud_name: process.env.CLOUD_NAME,
			api_key: process.env.API_KEY,
			api_secret: process.env.API_SECRET,
		});
        console.log("Connection established");
	} catch (error) {
        console.log("Connection failed");
		console.log(error);
	}
};