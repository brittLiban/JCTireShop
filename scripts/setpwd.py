import bcrypt
h = bcrypt.hashpw(b'B1@&Ho!', bcrypt.gensalt(10)).decode()
env = open('/root/jctireshop/.env').read()
out = []
for l in env.splitlines():
    if l.startswith('ADMIN_PASSWORD_HASH='):
        out.append("ADMIN_PASSWORD_HASH='" + h + "'")
    else:
        out.append(l)
open('/root/jctireshop/.env', 'w').write('\n'.join(out) + '\n')
print('Done:', h)
