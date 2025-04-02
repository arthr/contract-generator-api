FROM mongo:latest

# Rótulos para melhor manutenibilidade
LABEL maintainer="Contract Generator Team"
LABEL description="Container MongoDB para Contract Generator API"

# Criar diretório para dados e configurar permissões
RUN mkdir -p /data/db /data/configdb && \
    chown -R mongodb:mongodb /data/db /data/configdb

# Configurar MongoDB (ajuste conforme necessário)
COPY mongod.conf.orig /etc/mongod.conf.orig
RUN chmod 644 /etc/mongod.conf.orig

# Expor porta do MongoDB
EXPOSE 27017

# Configurar verificação de saúde para confirmar que o container está saudável
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD mongosh --eval "db.adminCommand('ping')" || exit 1

# Definir comando padrão
CMD ["mongod", "--config", "/etc/mongod.conf"]

# Definir diretório de trabalho
WORKDIR /data

# Boas práticas:
# 1. Usamos a imagem oficial do MongoDB (mongo) como base
# 2. Adicionamos uma verificação de saúde para confirmar que o serviço está responsivo
# 3. Expor apenas a porta necessária
# 4. Usar permissões adequadas para diretórios do MongoDB
# 5. Fornecer um comando padrão com configuração
# 
# Nota: Em produção, considere adicionar:
# - Usuário não-root para executar o MongoDB
# - Pontos de montagem de volume para dados persistentes
# - Configuração de autenticação
# - Configuração personalizada do MongoDB ajustada para sua carga de trabalho

