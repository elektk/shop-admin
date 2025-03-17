import { mongooseConnect } from "@/lib/mongoose";
import { isAdminRequest } from "@/pages/api/auth/[...nextauth]";
import { Admin } from "@/models/Admin";

export default async function handle(req, res) {
  try {
    await mongooseConnect();
    await isAdminRequest(req, res);

    if (req.method === 'POST') {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      const existingAdmin = await Admin.findOne({ email });
      if (existingAdmin) {
        return res.status(400).json({ message: 'Admin already exists!' });
      }

      const newAdmin = await Admin.create({ email });
      return res.status(201).json(newAdmin);
    }

    if (req.method === 'DELETE') {
      const { _id } = req.query;

      if (!_id) {
        return res.status(400).json({ message: 'Admin ID is required' });
      }

      const deletedAdmin = await Admin.findByIdAndDelete(_id);
      if (!deletedAdmin) {
        return res.status(404).json({ message: 'Admin not found' });
      }

      return res.json({ success: true });
    }

    if (req.method === 'GET') {
      const admins = await Admin.find();
      return res.json(admins);
    }

    res.status(405).json({ message: 'Method not allowed' });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
