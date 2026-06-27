insert into teams (name, city)
values
  ('Blue Grid', 'Самара'),
  ('Threat Forge', 'Новосибирск'),
  ('Red Harbor', 'Казань')
on conflict (name) do nothing;

insert into users (email, password_hash, display_name, city, primary_track, role, team_id)
select
  'admin@cyberarena.local',
  'scrypt:720f0398c4dccc41a1a9a623efbc213a:edd9d7598f711361e27a9d2b7514b39d3e68b62dd1ddc4b9b528ca88441bd92e056ccb960470bff19c22a19c64a76f29c226873fa6fc1b41134100bf775d6ddf',
  'Администратор',
  'Самара',
  'Platform',
  'admin',
  null
where not exists (
  select 1 from users where email = 'admin@cyberarena.local'
);
