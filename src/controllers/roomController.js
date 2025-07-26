const Rooms = require("../models/Rooms");
const Questions = require("../models/Questions");
const { request } = require("http");
const { callGemini } = require("../services/geminiService");

const roomController = {
    // POST: /room/
    createRoom: async (request, response) => {
        try {
            const { createdBy } = request.body;

            const code = Math.random().toString(36)
                .substring(2, 8).toUpperCase();

            const room = await Rooms.create({
                roomCode: code,
                createdBy: createdBy
            });

            response.json(room);
        } catch (error) {
            console.log(error);
            response.status(500).json({ message: 'Internal server error' });
        }
    },

    // GET /room/:code
    getByRoomCode: async (request, response) => {
        try {
            const code = request.params.code;

            const room = await Rooms.findOne({ roomCode: code });
            if (!room) {
                return response.status(404).json({ message: 'Invalid room code' });
            }

            response.json(room);
        } catch (error) {
            console.log(error);
        }
    },

    // POST /room/:code/question
    createQuestion: async (request, response) => {
        try {
            const { content, createdBy, user } = request.body;
            const { code } = request.params;

            // Use user field if available, otherwise use createdBy
            const userName = user || createdBy || "Anonymous";

            const question = await Questions.create({
                roomCode: code,
                content: content,
                createdBy: userName
            });

            // Add user field to the response for client-side consistency
            const questionWithUser = {
                ...question.toObject(),
                user: userName
            };

            const io = request.app.get("io");
            io.to(code).emit("new-question", questionWithUser);

            response.json(questionWithUser);
        } catch (error) {
            console.log(error);
            response.status(500).json({ message: 'Internal server error' });
        }
    },

    // GET /room/:code/question
    getQuestions: async (request, response) => {
        try {
            const code = request.params.code;

            const questions = await Questions.find({ roomCode: code })
                .sort({ createdAt: -1 });

            // Add user field to each question for client-side consistency
            const questionsWithUser = questions.map(question => ({
                ...question.toObject(),
                user: question.createdBy
            }));

            response.json(questionsWithUser);
        } catch (error) {
            console.log(error);
            response.status(500).json({ message: 'Internal server error' });
        }
    },

    generateTopQuestions: async (request, response) => {
        try {
            const code = request.params.code;

            const questions = await Questions.find({ roomCode: code });
            if (questions.length === 0) return response.json([]);

            const topQuestions = await callGemini(questions);
            response.json(topQuestions);
        } catch (error) {
            console.log(error);
            response.status(500).json({ message: 'Internal server error' });
        }
    },

    // DELETE /room/:code/question/:questionId
    deleteQuestion: async (request, response) => {
        try {
            const { code, questionId } = request.params;
            const question = await Questions.findByIdAndDelete(questionId);
            if (!question) {
                return response.status(404).json({ message: 'Question not found' });
            }
            // Emit question deleted event
            const io = request.app.get("io");
            io.to(code).emit("question-deleted", questionId);
            response.json({ message: 'Question deleted successfully' });
        } catch (error) {
            console.log(error);
            response.status(500).json({ message: 'Internal server error' });
        }
    },
};

module.exports = roomController;