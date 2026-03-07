const express = require('express');
const router = express.Router();
const reminderService = require('../services/reminderService');
const cronScheduler = require('../services/cronScheduler');

// Simple auth middleware (temporary - replace with proper auth later)
const simpleAuth = (req, res, next) => {
    // For now, allow all requests
    // TODO: Replace with proper protect middleware
    next();
};

/**
 * @route   GET /api/reminders/test
 * @desc    Run reminders manually (for testing)
 * @access  Public (temporary)
 */
router.get('/test', simpleAuth, async (req, res) => {
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
 * @access  Public (temporary)
 */
router.get('/status', simpleAuth, (req, res) => {
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
 * @route   GET /api/reminders/upcoming
 * @desc    Get pledges that will need reminders
 * @access  Public (temporary)
 */
router.get('/upcoming', simpleAuth, async (req, res) => {
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
 * @access  Public (temporary)
 */
router.post('/send/:pledgeId', simpleAuth, async (req, res) => {
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
