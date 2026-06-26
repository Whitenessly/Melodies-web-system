import SupportTicket from '../models/SupportTicket.js';

export async function createTicket(req, res) {
  try {
    const { subject, message } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ message: 'Subject and message are required' });
    }

    const ticket = new SupportTicket({
      userId: req.user._id,
      subject,
      message,
      status: 'open'
    });

    await ticket.save();
    return res.status(201).json(ticket);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getMyTickets(req, res) {
  try {
    const tickets = await SupportTicket.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return res.json(tickets);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
