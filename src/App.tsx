import React, { useEffect, useState } from "react";
import { ItemCardapio, ItemPedido, Pedido } from "./types";

const API_BASE = "http://localhost:8081/api/pedidos";

const restauranteId = "1"; // exemplo fixo
const clienteId = "cliente123"; // exemplo fixo

function App() {
  const [cardapio, setCardapio] = useState<ItemCardapio[]>([]);
  const [pedido, setPedido] = useState<Pedido>({
    clienteId,
    itens: [],
  });
  const [statusPedido, setStatusPedido] = useState<string | null>(null);

  // Carrega cardápio ao montar
  useEffect(() => {
    fetch(`${API_BASE}/restaurante/${restauranteId}/itens`)
      .then(res => res.json())
      .then(setCardapio)
      .catch(err => alert("Erro ao buscar cardápio: " + err));
  }, []);

  // Adiciona item ao pedido
  const addItem = (item: ItemCardapio) => {
    const jaExiste = pedido.itens.find(i => i.produtoId === item.id);
    let novosItens: ItemPedido[];
    if (jaExiste) {
      novosItens = pedido.itens.map(i =>
        i.produtoId === item.id
          ? { ...i, quantidade: i.quantidade + 1 }
          : i
      );
    } else {
      novosItens = [
        ...pedido.itens,
        {
          produtoId: item.id,
          nomeProduto: item.nome,
          quantidade: 1,
          precoUnitario: item.preco,
        },
      ];
    }
    setPedido({ ...pedido, itens: novosItens });
  };

  // Remove item ou diminui quantidade
  const removeItem = (itemId: string) => {
    let novosItens = pedido.itens
      .map(i =>
        i.produtoId === itemId && i.quantidade > 1
          ? { ...i, quantidade: i.quantidade - 1 }
          : i
      )
      .filter(i => i.quantidade > 0);
    setPedido({ ...pedido, itens: novosItens });
  };

  // Soma total
  const valorTotal = pedido.itens.reduce(
    (acc, i) => acc + i.precoUnitario * i.quantidade,
    0
  );

  // Envia pedido para o backend
  const efetuarPedido = async () => {
    setStatusPedido(null);
    if (pedido.itens.length === 0) {
      setStatusPedido("Adicione ao menos um item.");
      return;
    }
    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pedido),
      });
      if (res.ok) {
        setStatusPedido("Pedido realizado com sucesso!");
        setPedido({ clienteId, itens: [] });
      } else {
        setStatusPedido("Erro ao efetuar pedido.");
      }
    } catch (e) {
      setStatusPedido("Erro ao conectar ao backend.");
    }
  };

  return (
    <div className="container mt-5">
      <h1>Cardápio do Restaurante</h1>
      <div className="row">
        {cardapio.length === 0 && <div className="col-12">Carregando...</div>}
        {cardapio.map(item => (
          <div key={item.id} className="col-md-4 mb-3">
            <div className="card">
              <div className="card-body">
                <h5>{item.nome}</h5>
                <p>{item.descricao}</p>
                <p><strong>R$ {item.preco.toFixed(2)}</strong></p>
                <button
                  className="btn btn-primary"
                  onClick={() => addItem(item)}
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-4">Meu Pedido</h2>
      {pedido.itens.length === 0 && <p>Nenhum item no pedido.</p>}
      {pedido.itens.length > 0 && (
        <table className="table">
          <thead>
            <tr>
              <th>Produto</th>
              <th>Qtd</th>
              <th>Preço un.</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pedido.itens.map(i => (
              <tr key={i.produtoId}>
                <td>{i.nomeProduto}</td>
                <td>{i.quantidade}</td>
                <td>R$ {i.precoUnitario.toFixed(2)}</td>
                <td>R$ {(i.precoUnitario * i.quantidade).toFixed(2)}</td>
                <td>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => removeItem(i.produtoId)}
                  >
                    Remover
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <h4>Total: R$ {valorTotal.toFixed(2)}</h4>
      <button
        className="btn btn-success mt-2"
        onClick={efetuarPedido}
        disabled={pedido.itens.length === 0}
      >
        Efetuar Pedido
      </button>
      {statusPedido && (
        <div className="mt-3 alert alert-info">{statusPedido}</div>
      )}
    </div>
  );
}

export default App;