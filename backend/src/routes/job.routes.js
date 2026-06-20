const express = require("express");

const router = express.Router();

const authMiddleware = require(
  "../middleware/auth"
);

const jobService = require(
  "../services/job.service"
);

const {
  success,
  error,
} = require(
  "../utilities/responseHelper"
);

const { getNextRuns } = require(
  "../utilities/cronParser"
);

router.use(authMiddleware);

// Preview the next runs of a cron expression.
// Declared before "/:id" so it is not captured as an id.
router.get("/cron-preview", (req, res) => {
  const { expression } = req.query;

  if (!expression) {
    return error(res, "expression is required");
  }

  const result = getNextRuns(expression);

  if (!result.valid) {
    return error(res, result.error);
  }

  success(res, result);
});

router.post("/", async (req, res) => {
  try {
    const job = await jobService.createJob(
      req.user.userId,
      req.body
    );

    success(res, job, 201);
  } catch (err) {
    error(res, err.message);
  }
});

router.get("/", async (req, res) => {
  try {
    const jobs = await jobService.getJobs(
      req.user.userId,
      req.query
    );

    success(res, jobs);
  } catch (err) {
    error(res, err.message);
  }
});

router.get("/:id", async (req, res) => {
  try {
    const job = await jobService.getJobById(
      req.user.userId,
      req.params.id
    );

    success(res, job);
  } catch (err) {
    error(
      res,
      err.message,
      err.message === "Forbidden"
        ? 403
        : 404
    );
  }
});




router.put("/:id", async (req, res) => {
  try {
    const job = await jobService.updateJob(
      req.user.userId,
      req.params.id,
      req.body
    );

    success(res, job);
  } catch (err) {
    error(
      res,
      err.message,
      err.message === "Forbidden"
        ? 403
        : 404
    );
  }
});




router.delete("/:id", async (req, res) => {
  try {
    await jobService.deleteJob(
      req.user.userId,
      req.params.id
    );

    success(res, {
      message: "Job deleted",
    });
  } catch (err) {
    error(
      res,
      err.message,
      err.message === "Forbidden"
        ? 403
        : 404
    );
  }
});




router.patch("/:id/pause", async (req, res) => {
  try {
    const job = await jobService.pauseJob(
      req.user.userId,
      req.params.id
    );

    success(res, job);
  } catch (err) {
    error(
      res,
      err.message,
      err.message === "Forbidden"
        ? 403
        : 404
    );
  }
});




router.patch("/:id/resume", async (req, res) => {
  try {
    const job = await jobService.resumeJob(
      req.user.userId,
      req.params.id
    );

    success(res, job);
  } catch (err) {
    error(
      res,
      err.message,
      err.message === "Forbidden"
        ? 403
        : 404
    );
  }
});



module.exports = router;