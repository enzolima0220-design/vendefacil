# 🛒 VendeFácil

Sistema web de controle de vendas e estoque, com interface escura e minimalista inspirada em dashboards profissionais. Feito com **HTML, CSS e JavaScript puro**, sem frameworks e sem back-end: os dados ficam salvos no navegador (LocalStorage).

> Projeto de portfólio com código comentado e organizado para quem está aprendendo.

## ✨ Funcionalidades

- **Dashboard**: faturamento, quantidade de vendas, produtos cadastrados, estoque baixo, gráfico dos últimos 7 dias, últimas vendas, mais vendidos e atividades recentes. Tudo calculado a partir dos dados reais.
- **Produtos**: cadastrar, editar, excluir, pesquisar por nome/código e filtrar por categoria. Validação de campos vazios, valores negativos e códigos repetidos.
- **Vendas**: escolha o produto, informe a quantidade e veja preço e total. Bloqueia vendas sem estoque suficiente e atualiza estoque e indicadores na hora.
- **Histórico**: tabela com número identificador (`#0001`), busca, filtro por data e por status.
- **Cancelamento de vendas**: devolve as unidades ao estoque e remove a venda do faturamento. A venda continua visível no histórico como *Cancelada*.
- **Exportar / importar JSON**: backup completo dos dados, com validação rigorosa na importação.
- **Configurações**: nome da loja, limite de estoque baixo, dados de exemplo e limpeza total.

## 🚀 Como executar

Não precisa instalar nada.

1. Baixe ou clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/vendefacil.git
   cd vendefacil
   ```
2. Dê dois cliques em `index.html` (abre no navegador).

Opcional, para rodar com um servidor local:

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

## 📁 Estrutura

```
vendefacil/
├── index.html   # estrutura das telas
├── style.css    # visual (cores ficam nas variáveis do :root)
├── script.js    # toda a lógica, dividida em seções comentadas
└── README.md
```

## 🧠 Como funciona (para quem está estudando)

- **Estado único**: tudo fica no objeto `db` (produtos, vendas, log e configurações). Cada ação altera `db`, chama `save()` e depois `render()` redesenha as telas.
- **Persistência**: `save()` grava `db` no LocalStorage; `load()` lê ao abrir a página.
- **Navegação sem recarregar**: os botões da lateral apenas mostram/escondem as seções.
- **Cancelar venda**: a venda recebe `canceled: true` e o estoque do produto aumenta pela quantidade vendida. Se o produto já tiver sido excluído, a venda é cancelada, mas não há estoque para restaurar (o sistema avisa).
- **Segurança**: textos são escapados (`esc()`) antes de entrar no HTML, e a importação só aceita ids com letras, números, `_` e `-`.

## 💾 Formato do backup

```json
{
  "app": "VendeFácil",
  "version": 2,
  "exportedAt": "2026-11-11T12:00:00.000Z",
  "data": {
    "products": [{ "id": "a1", "code": "P001", "name": "Camiseta", "cat": "Roupas", "price": 49.9, "stock": 20 }],
    "sales": [{ "id": "s1", "num": 1, "date": "2026-11-11T12:00:00.000Z", "pid": "a1", "name": "Camiseta", "qty": 2, "price": 49.9, "total": 99.8, "canceled": false }],
    "log": [],
    "cfg": { "store": "Minha Loja", "low": 5 },
    "nextNum": 2
  }
}
```

Na importação, o arquivo é rejeitado (sem alterar nada) se tiver JSON inválido, preço ou estoque inválidos, ids ou códigos repetidos, datas inválidas ou arquivo maior que 5 MB. Dados da versão 1 do app também são migrados automaticamente.

## ⚠️ Limitações

- Os dados ficam só no navegador/dispositivo em uso: use **Exportar dados** para fazer backup.
- Não há login nem múltiplos usuários.

## 🗺️ Ideias para evoluir

- Relatórios por período e exportação para CSV
- Múltiplos itens por venda
- Back-end com banco de dados

## 📄 Licença

Distribuído sob a licença MIT. Use e modifique à vontade.
