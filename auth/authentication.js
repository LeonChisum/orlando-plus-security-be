const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const { supabase } = require('../lib/supabase')
const auth = require('../middleware/auth')

// @Route POST /auth/signUp
// @desc  Create a supervisor account
// @access Public
router.post('/signUp', async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { firstName, lastName },
    })

    if (error) {
      return res.status(400).json({ message: error.message })
    }

    const token = jwt.sign({ id: data.user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXP,
    })

    res.json({
      token,
      message: 'Thanks for signing up!',
      user: { id: data.user.id, email, firstName, lastName },
    })
  } catch (error) {
    next(error)
  }
})

// @Route POST /auth/login
// @desc  Sign in a supervisor
// @access Public
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return res.status(400).json({ message: 'Invalid email or password' })
    }

    const token = jwt.sign({ id: data.user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXP,
    })

    res.json({
      token,
      message: 'Thanks for signing in!',
      user: {
        id: data.user.id,
        email: data.user.email,
        ...data.user.user_metadata,
      },
    })
  } catch (error) {
    next(error)
  }
})

// @Route GET /auth/admin
// @desc  Get the currently logged-in supervisor
// @access Private
router.get('/admin', auth, async (req, res, next) => {
  try {
    const { data, error } = await supabase.auth.admin.getUserById(req.user.id)

    if (error) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({
      admin: {
        id: data.user.id,
        email: data.user.email,
        ...data.user.user_metadata,
      },
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router
