update technologies
set is_active = false,
    updated_at = now()
where lower(name) = 'dynamodb';
