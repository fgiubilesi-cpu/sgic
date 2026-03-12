-- Reset password utente admin a 'Sgic2024!'
UPDATE auth.users 
SET encrypted_password = crypt('Sgic2024!', gen_salt('bf'))
WHERE email = 'f.giubilesi@giubilesiassociati.it';;
