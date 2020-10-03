var client_id = "CLIENT_ID";
var client_secret = "CLIENT_SECRET";
var redirect_uri = 'http://localhost:8888/callback';

exports.secrets = function() {
      return [client_id, client_secret, redirect_uri];
};
