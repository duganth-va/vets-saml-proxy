const { rethrowIfRuntimeError } = require("../../../utils");
class GetPatientInfoFromValidateEndpointStrategy {
  constructor(validateToken, logger) {
    this.logger = logger;
    this.validateToken = validateToken;
  }
  async createPatientInfo(tokens, decoded) {
    let patient;
    try {
      const validation_result = await this.validateToken(
        tokens.access_token,
        decoded.aud
      );
      patient = validation_result.va_identifiers.icn;
    } catch (error) {
      rethrowIfRuntimeError(error);
      if (error.response) {
        this.logger.error({
          message: "Server returned status code " + error.response.status,
        });
      } else {
        this.logger.error({ message: error.message });
      }
      throw {
        error: "invalid_grant",
        error_description:
          "Could not find a valid patient identifier for the provided authorization code.",
        status: 500,
      };
    }
    return patient;
  }
}

module.exports = { GetPatientInfoFromValidateEndpointStrategy };
