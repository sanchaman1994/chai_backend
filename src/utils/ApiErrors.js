
    class ApiEerror extends Error {
      constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack = ""
      ) {
        super(message);  // Call the Error constructor with the provided message

        // Set the provided status code to the statusCode property of the instance
        this.statusCode = statusCode;

        // Initialize data property to null. This can be used to attach any data relevant to the error.
        this.data = null;

        // Set the message property to the provided message
        this.message = message;

        // Set the success property to false. This indicates that the operation was not successful.
        this.success = false;

        // Set the errors property to the provided errors. This can be used to attach any errors relevant to the operation.
        this.errors = errors;

        // If a stack trace is provided, set the stack property to the provided stack trace.
        // Otherwise, capture the stack trace at the time of error creation.
        if (stack) {
          this.stack = stack;
        } else {
          Error.captureStackTrace(this, this.constructor);
        }
      }
    }
   