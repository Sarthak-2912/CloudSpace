const express = require('express');
const File = require('../models/File');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Upload file
router.post('/upload', authMiddleware, async (req, res) => {
  try {
    const { name, data, type } = req.body;

    if (!name || !data || !type) {
      return res.status(400).json({ message: 'Name, data, and type are required' });
    }

    // Calculate size from base64
    const size = Buffer.byteLength(data, 'base64');

    if (size > MAX_FILE_SIZE) {
      return res.status(400).json({ message: 'File size exceeds 10MB limit' });
    }

    const file = new File({
      name,
      data,
      type,
      size,
      owner: req.userId,
    });

    await file.save();
    res.status(201).json({ message: 'File uploaded successfully', file });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get user's files
router.get('/my-files', authMiddleware, async (req, res) => {
  try {
    const files = await File.find({ owner: req.userId })
      .select('-data')
      .sort({ createdAt: -1 });
    res.json(files);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get shared files
router.get('/shared', authMiddleware, async (req, res) => {
  try {
    const files = await File.find({ sharedWith: req.userId })
      .select('-data')
      .populate('owner', 'username email')
      .sort({ createdAt: -1 });
    res.json(files);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get recent files (dashboard)
router.get('/recent', authMiddleware, async (req, res) => {
  try {
    const myFiles = await File.find({ owner: req.userId })
      .select('-data')
      .limit(5)
      .sort({ createdAt: -1 });

    const sharedFiles = await File.find({ sharedWith: req.userId })
      .select('-data')
      .populate('owner', 'username email')
      .limit(5)
      .sort({ createdAt: -1 });

    res.json({
      myFiles,
      sharedFiles,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get file by ID (with authorization check)
router.get('/:id', async (req, res) => {
  try {
    const file = await File.findById(req.params.id).populate('owner', 'username');

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check if public or user has access
    const token = req.header('Authorization')?.replace('Bearer ', '');
    let userId = null;

    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cloudspace_secret_key_2024');
        userId = decoded.userId;
      } catch (err) {
        // Token invalid, continue as guest
      }
    }

    const isOwner = file.owner._id.toString() === userId?.toString();
    const isSharedWith = file.sharedWith.some(id => id.toString() === userId?.toString());

    if (!file.public && !isOwner && !isSharedWith) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(file);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Share file with user
router.post('/share', authMiddleware, async (req, res) => {
  try {
    const { fileId, email } = req.body;

    if (!fileId || !email) {
      return res.status(400).json({ message: 'File ID and email are required' });
    }

    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check if user is owner
    if (file.owner.toString() !== req.userId) {
      return res.status(403).json({ message: 'Only owner can share' });
    }

    // Find user by email
    const userToShare = await User.findOne({ email });
    if (!userToShare) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already shared
    if (file.sharedWith.includes(userToShare._id)) {
      return res.status(400).json({ message: 'File already shared with this user' });
    }

    // Add to sharedWith
    file.sharedWith.push(userToShare._id);
    await file.save();

    res.json({ message: 'File shared successfully', file });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete file
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check if user is owner
    if (file.owner.toString() !== req.userId) {
      return res.status(403).json({ message: 'Only owner can delete' });
    }

    await File.findByIdAndDelete(req.params.id);
    res.json({ message: 'File deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Toggle public access
router.post('/:id/toggle-public', authMiddleware, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (file.owner.toString() !== req.userId) {
      return res.status(403).json({ message: 'Only owner can change visibility' });
    }

    file.public = !file.public;
    await file.save();

    res.json({ message: 'Visibility updated', file });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get storage usage
router.get('/storage/usage', authMiddleware, async (req, res) => {
  try {
    const files = await File.find({ owner: req.userId });
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const maxSize = 10 * 1024 * 1024;

    res.json({
      used: totalSize,
      max: maxSize,
      percentage: (totalSize / maxSize) * 100,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;