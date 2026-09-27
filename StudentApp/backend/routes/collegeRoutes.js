import express from 'express';
import { dbStore } from '../dbStore.js';
import { logUserActivity } from '../services/auditLogger.js';

const router = express.Router();

// 1. Get All Colleges
router.get('/', (req, res) => {
  try {
    const colleges = dbStore.getColleges();
    return res.json({ success: true, count: colleges.length, colleges });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 2. College Admin Dashboard Metrics & Verification Queues
router.get('/:collegeId/dashboard', (req, res) => {
  try {
    const collegeId = Number(req.params.collegeId) || 1;
    const college = dbStore.getCollegeById(collegeId) || dbStore.getColleges()[0];

    const allStudents = dbStore.getStudents().filter(s => Number(s.college_id) === collegeId);
    const allAlumni = dbStore.getAlumni().filter(a => Number(a.college_id) === collegeId);
    const allMentorships = dbStore.getMentorships().filter(m => {
      const student = dbStore.getStudentById(m.student_id);
      return student && Number(student.college_id) === collegeId;
    });
    const allReferrals = dbStore.getReferrals().filter(r => {
      const student = dbStore.getStudentById(r.student_id);
      return student && Number(student.college_id) === collegeId;
    });

    const pendingStudents = allStudents.filter(s => s.verification_status === 'Pending');
    const verifiedStudents = allStudents.filter(s => s.verification_status === 'Verified');
    const pendingAlumni = allAlumni.filter(a => a.verification_status === 'Pending');
    const verifiedAlumni = allAlumni.filter(a => a.verification_status === 'Verified');

    return res.json({
      success: true,
      college,
      metrics: {
        totalStudents: allStudents.length,
        verifiedStudents: verifiedStudents.length,
        pendingStudents: pendingStudents.length,
        totalAlumni: allAlumni.length,
        verifiedAlumni: verifiedAlumni.length,
        pendingAlumni: pendingAlumni.length,
        activeMentorships: allMentorships.filter(m => m.status === 'ACCEPTED' || m.status === 'ACTIVE').length,
        placementReferrals: allReferrals.length
      },
      pendingStudentsQueue: pendingStudents,
      pendingAlumniQueue: pendingAlumni,
      recentStudents: allStudents.slice(0, 10),
      recentAlumni: allAlumni.slice(0, 10)
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. College Admin Verify / Reject Student
router.post('/verify-student', async (req, res) => {
  try {
    const { studentId, status, collegeAdminId } = req.body;
    if (!studentId || !status) return res.status(400).json({ error: 'studentId and status are required' });

    const student = dbStore.getStudentById(studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    student.verification_status = status;
    dbStore.upsertStudent(student);

    // Notify student
    dbStore.createNotification({
      user_id: `STUDENT-${studentId}`,
      type: 'VERIFICATION',
      title: status === 'Verified' ? 'Student Verification Approved!' : 'Student Verification Update',
      message: `Your college administration has updated your status to: ${status}`,
      link: '/dashboard'
    });

    await logUserActivity({
      userId: collegeAdminId || 'college_admin',
      action: status === 'Verified' ? 'VERIFY_STUDENT_APPROVED' : 'VERIFY_STUDENT_REJECTED',
      target_type: 'student',
      target_id: String(studentId),
      details: { status },
      req
    });

    return res.json({ success: true, message: `Student verification updated to ${status}!`, student });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. College Admin Verify / Reject Alumni
router.post('/verify-alumni', async (req, res) => {
  try {
    const { alumniId, status, collegeAdminId } = req.body;
    if (!alumniId || !status) return res.status(400).json({ error: 'alumniId and status are required' });

    const alumni = dbStore.getAlumniById(alumniId);
    if (!alumni) return res.status(404).json({ error: 'Alumni not found' });

    alumni.verification_status = status;
    dbStore.upsertAlumni(alumni);

    // Notify alumni
    dbStore.createNotification({
      user_id: `ALUMNI-${alumniId}`,
      type: 'VERIFICATION',
      title: status === 'Verified' ? 'Alumni Verification Approved!' : 'Alumni Verification Update',
      message: `Your college administration has verified your alumni credentials.`,
      link: '/alumni-dashboard'
    });

    await logUserActivity({
      userId: collegeAdminId || 'college_admin',
      action: status === 'Verified' ? 'VERIFY_ALUMNI_APPROVED' : 'VERIFY_ALUMNI_REJECTED',
      target_type: 'alumni',
      target_id: String(alumniId),
      details: { status },
      req
    });

    return res.json({ success: true, message: `Alumni verification updated to ${status}!`, alumni });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
