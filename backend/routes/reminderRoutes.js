const express = require('express');
const router = express.Router();
const reminderService = require('../services/reminderService');
const cronScheduler = require('../services/cronScheduler');
const advancedReminderService = require('../services/advancedReminderService');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/reminders/test
 * @desc    Run reminders manually (admin only)
 * @access  Protected - Admin
 */
router.get('/test', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const results = await cronScheduler.runManually();
        res.json({
            success: true,
            message: 'Reminders processed successfully',
            results
        });
    } catch (error) {
        console.error('Error running manual reminders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to run reminders',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/reminders/status
 * @desc    Get status of scheduled jobs
 * @access  Protected - Admin
 */
router.get('/status', authenticateToken, requireAdmin, (req, res) => {
    try {
        const status = cronScheduler.getJobStatus();
        res.json({
            success: true,
            jobs: status
        });
    } catch (error) {
        console.error('Error getting job status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get status',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/reminders/closures/preview
 * @desc    Preview campaign closures (dry-run) - shows intended recipients
 * @access  Protected - Admin
 */
router.get('/closures/preview', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await advancedReminderService.processCampaignClosures({ dryRun: true });
        res.json({ success: true, preview: result });
    } catch (error) {
        console.error('Error previewing campaign closures:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   POST /api/reminders/closures/run
 * @desc    Run campaign closures (optionally dry-run=false)
 * @access  Protected - Admin
 */
router.post('/closures/run', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { dryRun } = req.body || {};
        const result = await advancedReminderService.processCampaignClosures({ dryRun: Boolean(dryRun) });
        res.json({ success: true, result });
    } catch (error) {
        console.error('Error running campaign closures:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   GET /api/reminders/upcoming
 * @desc    Get pledges that will need reminders
 * @access  Protected - Staff/Admin
 */
router.get('/upcoming', authenticateToken, async (req, res) => {
    try {
        const [
            sevenDays,
            threeDays,
            dueToday,
            overdue
        ] = await Promise.all([
            reminderService.getPledgesNeedingReminder(7),
            reminderService.getPledgesNeedingReminder(3),
            reminderService.getPledgesNeedingReminder(0),
            reminderService.getOverduePledges()
        ]);
        
        res.json({
            success: true,
            reminders: {
                sevenDays: {
                    count: sevenDays.length,
                    pledges: sevenDays
                },
                threeDays: {
                    count: threeDays.length,
                    pledges: threeDays
                },
                dueToday: {
                    count: dueToday.length,
                    pledges: dueToday
                },
                overdue: {
                    count: overdue.length,
                    pledges: overdue
                }
            }
        });
    } catch (error) {
        console.error('Error getting upcoming reminders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get upcoming reminders',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/reminders/send/:pledgeId
 * @desc    Send reminder for specific pledge
 * @access  Protected - Staff/Admin
 */
router.post('/send/:pledgeId', authenticateToken, async (req, res) => {
    try {
        const { pledgeId } = req.params;
        const { type } = req.body; // '7_days', '3_days', 'due_today', 'overdue'
        
        // Get pledge details
        const db = require('../config/db');
        const [pledges] = await db.execute(
            'SELECT * FROM pledges WHERE id = ?',
            [pledgeId]
        );
        
        if (pledges.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pledge not found'
            });
        }
        
        const result = await reminderService.sendReminder(pledges[0], type || '7_days');
        
        res.json({
            success: true,
            message: 'Reminder sent',
            result
        });
    } catch (error) {
        console.error('Error sending reminder:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send reminder',
            error: error.message
        });
    }
});

module.exports = router;
