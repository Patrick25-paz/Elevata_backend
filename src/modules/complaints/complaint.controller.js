import complaintService from './complaint.service.js';
import { successResponse, createdResponse } from '../../utils/response.js';

class ComplaintController {
  async create(req, res, next) {
    try { return createdResponse(res, 'Complaint submitted successfully', await complaintService.createComplaint({ user: req.user, data: req.body, file: req.file })); } catch (error) { next(error); }
  }

  async list(req, res, next) {
    try { return successResponse(res, 'Complaints retrieved successfully', await complaintService.listComplaints(req.query)); } catch (error) { next(error); }
  }

  async update(req, res, next) {
    try { return successResponse(res, 'Complaint updated successfully', await complaintService.updateComplaint(req.params.id, req.body, req.user.id)); } catch (error) { next(error); }
  }

  async retry(req, res, next) {
    try { return successResponse(res, 'Complaint email delivery retried successfully', await complaintService.retryDelivery(req.params.id, req.user.id)); } catch (error) { next(error); }
  }

  async evidence(req, res, next) {
    try { const file = await complaintService.getEvidence(req.params.id, req.params.evidenceId); res.setHeader('Content-Type', file.mimeType); res.setHeader('Content-Disposition', `attachment; filename="${file.fileName.replaceAll('"', '')}"`); return res.send(file.content); } catch (error) { next(error); }
  }
}

export default new ComplaintController();