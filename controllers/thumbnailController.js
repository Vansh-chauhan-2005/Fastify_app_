const Thumbnail = require("../models/thumbnail.js");
const path = require("path");
const fs = require("fs");
const { pipeline } = require("stream");
const utils = require("util");
const pipelineAsync = utils.promisify(pipeline);

exports.createThumbnail = async (request, reply) => {
  try {
    // Fixed: Use request.parts() (plural)
    const parts = request.parts();
    let fields = {};
    let savedFilename = ""; // Fixed: Track filename properly in scope

    for await (const part of parts) {
      if (part.file) {
        savedFilename = `${Date.now()}-${part.filename}`;
        const saveTo = path.join(
          __dirname,
          "..",
          "uploads",
          "thumbnails",
          savedFilename,
        );
        await pipelineAsync(part.file, fs.createWriteStream(saveTo));
      } else {
        fields[part.fieldname] = part.value;
      }
    }

    // Create a new thumbnail document
    const thumbnail = new Thumbnail({
      user: request.user.id,
      videoName: fields.videoName,
      version: fields.version,
      image: `/uploads/thumbnails/${savedFilename}`, // Fixed: Uses savedFilename
      paid: fields.paid === "true",
    });

    await thumbnail.save();
    reply
      .code(201)
      .send({ message: "Thumbnail created successfully", thumbnail });
  } catch (err) {
    reply.send(err);
  }
};

exports.getThumbnails = async (request, reply) => {
  try {
    const thumbnails = await Thumbnail.find({ user: request.user.id });
    reply.send(thumbnails);
  } catch (err) {
    reply.send(err);
  }
};

exports.getThumbnail = async (request, reply) => {
  try {
    const thumbnailId = request.params.id;
    if (!thumbnailId.match(/^[0-9a-fA-F]{24}$/)) {
      return reply.code(400).send({ message: "Invalid thumbnail ID" });
    }
    const thumbnail = await Thumbnail.findOne({
      _id: thumbnailId,
      user: request.user.id,
    });
    if (!thumbnail) {
      return reply.code(404).send({ message: "Thumbnail not found" });
    }
    reply.send(thumbnail);
  } catch (err) {
    reply.send(err);
  }
};

exports.updateThumbnail = async (request, reply) => {
  try {
    const updatedData = request.body;
    const thumbnail = await Thumbnail.findOneAndUpdate(
      {
        _id: request.params.id,
        user: request.user.id,
      },
      updatedData,
      { new: true },
    );
    if (!thumbnail) {
      return reply.code(404).send({ message: "Thumbnail not found" });
    }
    reply.send({ message: "Thumbnail updated successfully", thumbnail });
  } catch (err) {
    reply.send(err);
  }
};

exports.deleteThumbnail = async (request, reply) => {
  try {
    const thumbnail = await Thumbnail.findOneAndDelete({
      _id: request.params.id,
      user: request.user.id,
    });
    if (!thumbnail) {
      return reply.code(404).send({ message: "Thumbnail not found" });
    }

    // Fixed: Use path.basename to prevent duplicate folder nesting
    const filePath = path.join(
      __dirname,
      "..",
      "uploads",
      "thumbnails",
      path.basename(thumbnail.image),
    );

    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("Error deleting file:", err);
      }
    });

    reply.send({ message: "Thumbnail deleted successfully" });
  } catch (err) {
    reply.send(err);
  }
};

exports.deleteAllThumbnails = async (request, reply) => {
  try {
    const thumbnails = await Thumbnail.find({ user: request.user.id });
    if (thumbnails.length === 0) {
      return reply.code(404).send({ message: "No thumbnails found" });
    }

    await Thumbnail.deleteMany({ user: request.user.id });

    for (const thumbnail of thumbnails) {
      const filePath = path.join(
        __dirname,
        "..",
        "uploads",
        "thumbnails",
        path.basename(thumbnail.image),
      );
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error("Error deleting file:", err);
        }
      });
    }

    reply.send({ message: "All thumbnails deleted successfully" });
  } catch (err) {
    reply.send(err);
  }
};
