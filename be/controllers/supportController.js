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
      message
    });

    await ticket.save();

    return res.status(201).json({ message: 'Support request submitted successfully', ticket });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to submit support request', error: err.message });
  }
}

export async function getUserTickets(req, res) {
  try {
    let query = {};
    if (req.user.role !== 'admin') {
      query.userId = req.user._id;
    }

    const tickets = await SupportTicket.find(query)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 });

    return res.status(200).json({ tickets });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to retrieve tickets', error: err.message });
  }
}

export async function adminRespondTicket(req, res) {
  try {
    const { id } = req.params;
    const { response, status } = req.body;

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({ message: 'Support ticket not found' });
    }

    if (response) ticket.response = response;
    if (status) ticket.status = status;

    await ticket.save();

    return res.status(200).json({ message: 'Support ticket updated successfully', ticket });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update support ticket', error: err.message });
  }
}
