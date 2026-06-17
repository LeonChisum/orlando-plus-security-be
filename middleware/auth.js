const { supabase } = require('../lib/supabase')

async function auth(req, res, next) {
  const token = req.header('authorization')
  if (!token) return res.status(401).json({ message: 'authorization denied' })

  const { data: { user }, error } = await supabase.auth.admin.getUser(token)
  if (error || !user) return res.status(401).json({ message: 'authorization denied' })

  req.user = { id: user.id }
  next()
}

module.exports = auth
