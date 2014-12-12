# offline environment extends the production environment
require Rails.root.join('config/environments/production')

Dashboard::Application.configure do
  config.assets.prefix = 'offline-assets'
  config.assets.version = 'offline'
end
