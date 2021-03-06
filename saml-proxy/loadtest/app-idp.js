// This express app exists to simulate requests to Okta and Id.me for laod testing purposes.

const express = require("express");
const constants = require("../src/routes/constants");
const handlers = require("../src/routes/handlers");
const IDPConfig = require("../src/IDPConfig").default;
const SPConfig = require("../src/SPConfig").default;
const cli = require("../src/cli");
const configureHandlebars = require("../src/routes/handlebars").default;

const process = require("process");
const samlp = require("samlp");
const http = require("http");
const https = require("https");
const assignIn = require("lodash.assignin");
const session = require("express-session");

function addRoutes(app) {
  app.get(
    ["/", "/idp", constants.IDP_SSO],
    handlers.parseSamlRequest,
    (req, res) => {
      req.user = {
        issuer: "loadtest",
        userName: "43bb64d44a44452a8b30929003a89f53",
        nameIdFormat: "urn:oasis:names:tc:SAML:2.0:nameid-format:persistent",
        authnContext: {
          sessionIndex: "_0342958353e84ec4afc641e27ff993c8",
          authnMethod: "http://idmanagement.gov/ns/assurance/loa/3",
        },
        claims: {
          birth_date: "1936-04-10",
          email: "vets.gov.user+503@id.me",
          fname: "Wendeline",
          social: "564930708",
          gender: "Female",
          lname: "O'Heffernan",
          level_of_assurance: "3",
          mname: "Kitty",
          multifactor: "true",
          uuid: "43bb64d44a44452a8b30929003a89f53",
        },
      };
      const authOptions = assignIn({}, req.idp.options);
      authOptions.RelayState = req.session.authnRequest.RelayState;
      samlp.auth(authOptions)(req, res);
    }
  );
  app.post(["/", "/idp", constants.IDP_SSO], handlers.parseSamlRequest);

  app.get(constants.IDP_METADATA, function (req, res, next) {
    samlp.metadata(req.idp.options)(req, res);
  });

  return app;
}

function runServer(argv) {
  const app = express();
  app.set("port", parseInt(process.env.PORT || argv.port) + 1);
  const spConfig = new SPConfig(argv);
  const idpConfig = new IDPConfig(argv);
  const httpServer = argv.idpHttps
    ? https.createServer(
        { key: argv.idpHttpsPrivateKey, cert: argv.idpHttpsCert },
        app
      )
    : http.createServer(app);

  const hbs = configureHandlebars();
  app.set("view engine", "hbs");
  app.set("view options", { layout: "layout" });
  app.engine("handlebars", hbs.__express);

  app.use(
    session({
      secret:
        "The universe works on a math equation that never even ever really ends in the end",
      resave: false,
      saveUninitialized: true,
      name: "idp_sid",
      cookie: { maxAge: 60000 },
    })
  );

  app.use(function (req, res, next) {
    req.user = argv.idpConfig.user;
    req.metadata = argv.idpConfig.metadata;
    req.sp = { options: spConfig };
    req.idp = { options: idpConfig };
    next();
  });
  addRoutes(app);

  console.log("starting proxy server on port %s", app.get("port"));

  httpServer.listen(app.get("port"));
}

function main() {
  runServer(cli.processArgs());
}

module.exports = {
  runServer,
  main,
};

if (require.main === module) {
  main();
}
