import React, { useEffect, useState } from "react";
import { ItemCardapio, ItemPedido, Pedido } from "./types";

// Adicione este exemplo na sua definição de tipos:
// export interface Pedido {
//   id?: string;
//   clienteId: string;
//   entregadorId?: string; // <-- Esta linha nova!
//   itens: ItemPedido[];
//   status?: string;
// }

const API_BASE = "http://localhost:8081/api/pedidos";

type StatusEntrega = {
  entregador: string;
  status: string;
};

type Cliente = { nome: string; id: string };

function App() {
  const [cardapio, setCardapio] = useState<ItemCardapio[]>([]);
  const [pedido, setPedido] = useState<Pedido>({
    clienteId: "",
    itens: [],
  });
  const [statusPedido, setStatusPedido] = useState<string | null>(null);
  const [tela, setTela] = useState<"cardapio" | "acompanhamento" | "pedidos" | "login">("login");
  const [statusEntrega, setStatusEntrega] = useState<StatusEntrega | null>(null);
  const [nomeCliente, setNomeCliente] = useState<string>("Cliente");
  const [pedidosCliente, setPedidosCliente] = useState<Pedido[]>([]);
  const [clientes, setClientes] = useState<Record<string, string>>({});
  const [clienteIdInput, setClienteIdInput] = useState<string>("");
  const [nomesEntregadores, setNomesEntregadores] = useState<Record<string, string>>({});
  const [ultimoPedidoId, setUltimoPedidoId] = useState<string | null>(null);

  const handleLogin = () => {
    if (clienteIdInput.trim().length === 0) {
      alert("Informe o ID do cliente!");
      return;
    }
    setPedido((p) => ({
      ...p,
      clienteId: clienteIdInput,
    }));
    setTela("cardapio");
  };

  useEffect(() => {
    if (!pedido.clienteId) return;
    fetch(`${API_BASE}/cliente/${pedido.clienteId}/nome`)
      .then(res => res.json())
      .then(data => setNomeCliente(data.nome || "Cliente"))
      .catch(() => setNomeCliente("Cliente"));
  }, [pedido.clienteId]);

  useEffect(() => {
    if (tela === "cardapio") {
      fetch(`${API_BASE}/itensCardapio`)
        .then(res => res.json())
        .then(data => setCardapio(Array.isArray(data) ? data : []))
        .catch(err => {
          alert("Erro ao buscar cardápio: " + err);
          setCardapio([]);
        });
    }
  }, [tela]);

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

  const removeItem = (itemId: string) => {
    const novosItens = pedido.itens
      .map(i =>
        i.produtoId === itemId
          ? { ...i, quantidade: i.quantidade - 1 }
          : i
      )
      .filter(i => i.quantidade > 0);
    setPedido({ ...pedido, itens: novosItens });
  };

  const valorTotal = pedido.itens.reduce(
    (acc, i) => acc + i.precoUnitario * i.quantidade,
    0
  );

  const buscarStatusEntrega = async (pedidoId: string) => {
    setStatusEntrega(null);
    try {
      const res = await fetch(`${API_BASE}/${pedidoId}`);
      if (res.ok) {
        const data = await res.json();
        let entregador = "-";
        if (data.entregadorId) {
          try {
            const nomeRes = await fetch(`${API_BASE}/entregador/${data.entregadorId}/nome`);
            if (nomeRes.ok) {
              const nomeData = await nomeRes.json();
              entregador = nomeData.nome || data.entregadorId;
            } else {
              entregador = "Entregador não disponível no momento";
            }
          } catch {
            entregador = "Entregador não disponível no momento";
          }
        } else {
          entregador = "Entregador não disponível no momento";
        }
        setStatusEntrega({
          entregador,
          status: data.status || "Aguardando entrega"
        });
      } else {
        setStatusEntrega({
          entregador: "Entregador não disponível no momento",
          status: "Status não encontrado, consulte o restaurante."
        });
      }
    } catch {
      setStatusEntrega({
        entregador: "Entregador não disponível no momento",
        status: "Falha ao consultar status do pedido."
      });
    }
  };

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
        const data = await res.json();
        setStatusPedido("Pedido realizado com sucesso!");
        setPedido({ clienteId: pedido.clienteId, itens: [] });
        setUltimoPedidoId(data.id);
        setTela("acompanhamento");
      } else {
        setStatusPedido("Erro ao efetuar pedido.");
      }
    } catch (e) {
      setStatusPedido("Erro ao conectar ao backend.");
    }
  };

  useEffect(() => {
    if (tela === "acompanhamento" && ultimoPedidoId) {
      buscarStatusEntrega(ultimoPedidoId);
    }
  }, [tela, ultimoPedidoId]);

  async function buscarNomeCliente(id: string): Promise<string> {
    try {
      const res = await fetch(`${API_BASE}/cliente/${id}/nome`);
      if (res.ok) {
        const data = await res.json();
        return data.nome || id;
      }
      return id;
    } catch {
      return id;
    }
  }

  async function buscarNomeEntregador(id: string): Promise<string> {
    try {
      const res = await fetch(`${API_BASE}/entregador/${id}/nome`);
      if (res.ok) {
        const data = await res.json();
        return data.nome || id;
      }
      return id;
    } catch {
      return id;
    }
  }

  const buscarPedidosCliente = async () => {
    if (!pedido.clienteId) return;
    try {
      const res = await fetch(`${API_BASE}/cliente/${pedido.clienteId}`);
      if (res.ok) {
        const data = await res.json();
        setPedidosCliente(Array.isArray(data) ? data : []);
        const pedidos: Pedido[] = Array.isArray(data) ? data : [];
        // Cliente:
        const clienteIds = [...new Set(pedidos.map((p) => p.clienteId))];
        const clientesPromises = clienteIds.map(async (id) => ({
          id,
          nome: await buscarNomeCliente(id),
        }));
        const nomesClientes = await Promise.all(clientesPromises);
        setClientes(Object.fromEntries(nomesClientes.map(o => [o.id, o.nome])));
        // Entregador:
        const entregadorIds = [
          ...new Set(pedidos.map((p) => p.entregadorId).filter(Boolean))
        ];
        const entregadoresPromises = entregadorIds.map(async (id) => ({
          id,
          nome: await buscarNomeEntregador(id),
        }));
        const nomesEntregadoresArray = await Promise.all(entregadoresPromises);
        setNomesEntregadores(Object.fromEntries(nomesEntregadoresArray.map(o => [o.id, o.nome])));
        setTela("pedidos");
      } else {
        alert("Erro ao buscar pedidos do cliente.");
      }
    } catch (e) {
      alert("Erro ao conectar ao backend.");
    }
  };

  const voltarParaCardapio = () => {
    setTela("cardapio");
    setStatusEntrega(null);
    setStatusPedido(null);
  };

  if (tela === "login") {
    return (
      <div className="container mt-5">
        <h2>Identifique-se</h2>
        <input
          type="text"
          placeholder="Informe seu ID de cliente"
          value={clienteIdInput}
          onChange={e => setClienteIdInput(e.target.value)}
          className="form-control mb-3"
        />
        <button
          className="btn btn-primary"
          onClick={handleLogin}
        >
          Entrar
        </button>
      </div>
    );
  }

  if (tela === "acompanhamento") {
    return (
      <div className="container mt-5">
        <h2>Acompanhe seu pedido</h2>
        {!statusEntrega && <div>Carregando status do pedido...</div>}
        {statusEntrega && (
          <div className="card p-4">
            <h4>Entregador: {statusEntrega.entregador}</h4>
            <p>Status do pedido: <strong>{statusEntrega.status}</strong></p>
          </div>
        )}
        <button className="btn btn-secondary mt-3" onClick={voltarParaCardapio}>
          Voltar ao Cardápio
        </button>
      </div>
    );
  }

  if (tela === "pedidos") {
    return (
      <div className="container mt-5">
        <h2>Meus Pedidos</h2>
        {pedidosCliente.length === 0 && <p>Nenhum pedido encontrado.</p>}
        {pedidosCliente.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Entregador</th>
                <th>Itens</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pedidosCliente.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{clientes[p.clienteId] || p.clienteId}</td>
                  <td>{p.entregadorId ? (nomesEntregadores[p.entregadorId] || p.entregadorId) : "-"}</td>
                  <td>
                    {p.itens.map(i => (
                      <div key={i.produtoId}>{i.nomeProduto} (x{i.quantidade})</div>
                    ))}
                  </td>
                  <td>
                    R$ {p.itens.reduce((acc, i) => acc + i.precoUnitario * i.quantidade, 0).toFixed(2)}
                  </td>
                  <td>{p.status || "Pendente"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <button className="btn btn-secondary mt-3" onClick={voltarParaCardapio}>
          Voltar ao Cardápio
        </button>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <h1>Faça seu pedido, {nomeCliente}!</h1>
      <button className="btn btn-outline-info mb-3" onClick={buscarPedidosCliente}>
        Ver meus pedidos
      </button>
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
        onClick={async () => {
          await efetuarPedido();
        }}
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