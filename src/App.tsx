import React, { useEffect, useState } from "react";
import { ItemCardapioDTO, ItemPedido, Pedido } from "./types";

const API_BASE = "https://pedidoplus-production.up.railway.app/api/pedidos";

type StatusEntrega = {
  entregador: string;
  status: string;
};

type NovoPedido = {
  clienteId: string;
  itens: ItemPedido[];
  entregadorId?: string | null;
};

type RestauranteResumoDTO = {
  id: string;
  nome: string;
  endereco?: string;
};

function App() {
  const [cardapio, setCardapio] = useState<ItemCardapioDTO[]>([]);
  const [pedido, setPedido] = useState<NovoPedido>({
    clienteId: "",
    itens: [],
  });
  const [statusPedido, setStatusPedido] = useState<string | null>(null);
  const [tela, setTela] = useState<"restaurantes" | "cardapio" | "acompanhamento" | "pedidos" | "login">("login");
  const [statusEntrega, setStatusEntrega] = useState<StatusEntrega | null>(null);
  const [nomeCliente, setNomeCliente] = useState<string>("Cliente");
  const [pedidosCliente, setPedidosCliente] = useState<Pedido[]>([]);
  const [clienteIdInput, setClienteIdInput] = useState<string>("");
  const [ultimoPedidoId, setUltimoPedidoId] = useState<string | null>(null);
  const [pedidoSelecionado, setPedidoSelecionado] = useState<string | null>(null);

  const [restaurantes, setRestaurantes] = useState<RestauranteResumoDTO[]>([]);
  const [restauranteSelecionado, setRestauranteSelecionado] = useState<RestauranteResumoDTO | null>(null);

  const handleLogin = () => {
    if (clienteIdInput.trim().length === 0) {
      alert("Informe o ID do cliente!");
      return;
    }
    setPedido((p) => ({
      ...p,
      clienteId: clienteIdInput,
    }));
    setTela("restaurantes");
  };

  useEffect(() => {
    if (!pedido.clienteId) return;
    fetch(`${API_BASE}/cliente/${pedido.clienteId}/nome`)
      .then((res) => res.json())
      .then((data) => setNomeCliente(data.nome || "Cliente"))
      .catch(() => setNomeCliente("Cliente"));
  }, [pedido.clienteId]);

  useEffect(() => {
    if (tela === "restaurantes") {
      fetch(`${API_BASE}/restaurantes`)
        .then((res) => res.json())
        .then((data) => setRestaurantes(Array.isArray(data) ? data : []))
        .catch(() => setRestaurantes([]));
    }
  }, [tela]);

  useEffect(() => {
    if (tela === "cardapio" && restauranteSelecionado) {
      fetch(`${API_BASE}/restaurantes/${restauranteSelecionado.id}/cardapio`)
        .then((res) => res.json())
        .then((data) => setCardapio(Array.isArray(data) ? data : []))
        .catch((err) => {
          alert("Erro ao buscar cardápio: " + err);
          setCardapio([]);
        });
    }
  }, [tela, restauranteSelecionado]);

  const addItem = (item: ItemCardapioDTO) => {
    const jaExiste = pedido.itens.find((i) => i.produtoId === item.id);
    let novosItens: ItemPedido[];
    if (jaExiste) {
      novosItens = pedido.itens.map((i) =>
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
      .map((i) =>
        i.produtoId === itemId
          ? { ...i, quantidade: i.quantidade - 1 }
          : i
      )
      .filter((i) => i.quantidade > 0);
    setPedido({ ...pedido, itens: novosItens });
  };

  const valorTotal = pedido.itens.reduce(
    (acc, i) => acc + i.precoUnitario * i.quantidade,
    0
  );

  const buscarStatusEntrega = async (pedidoId: string) => {
    setPedidoSelecionado(pedidoId);
    setStatusEntrega(null);
    try {
      const res = await fetch(`${API_BASE}/${pedidoId}/entregador`); 
      if (res.ok) {
        const data = await res.json();
        setStatusEntrega({
          entregador: data.nomeEntregador || data.entregadorId || "-",
          status: data.statusEntrega || "Aguardando entrega",
        });
      } else {
        setStatusEntrega({
          entregador: "Entregador não disponível no momento",
          status: "Status não encontrado, consulte o restaurante.",
        });
      }
    } catch {
      setStatusEntrega({
        entregador: "Entregador não disponível no momento",
        status: "Falha ao consultar status do pedido.",
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
      const res = await fetch(`${API_BASE}/criar-pedidos`, {
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


  const buscarPedidosCliente = async () => {
    if (!pedido.clienteId) return;
    try {
      const res = await fetch(`${API_BASE}/cliente/${pedido.clienteId}`);
      if (res.ok) {
        const pedidos: Pedido[] = await res.json();
        setPedidosCliente(Array.isArray(pedidos) ? pedidos : []);
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
    setPedidoSelecionado(null);
  };

  if (tela === "login") {
    return (
      <div className="container mt-5">
        <h2>Identifique-se</h2>
        <input
          type="text"
          placeholder="Informe seu ID de cliente"
          value={clienteIdInput}
          onChange={(e) => setClienteIdInput(e.target.value)}
          className="form-control mb-3"
        />
        <button className="btn btn-primary" onClick={handleLogin}>
          Entrar
        </button>
      </div>
    );
  }

  if (tela === "restaurantes") {
    return (
      <div className="container mt-5">
        <h2>Selecione um restaurante</h2>
        {restaurantes.length === 0 ? (
          <p>Nenhum restaurante disponível.</p>
        ) : (
          <div className="row">
            {restaurantes.map((rest) => (
              <div className="col-md-4 mb-3" key={rest.id}>
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title">{rest.nome}</h5>
                    {rest.endereco && <p className="card-text"><small>{rest.endereco}</small></p>}
                    <button
                      className="btn btn-success"
                      onClick={() => {
                        setRestauranteSelecionado(rest);
                        setTela("cardapio");
                        setPedido({ ...pedido, itens: [] });
                      }}
                    >
                      Ver cardápio
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <button
          className="btn btn-secondary mt-3"
          onClick={() => setTela("login")}
        >
          Sair
        </button>
      </div>
    );
  }

  if (tela === "cardapio") {
    return (
      <div className="container mt-4">
        <h2>Bem-vindo, {nomeCliente}!</h2>
        <h3>Cardápio {restauranteSelecionado ? `- ${restauranteSelecionado.nome}` : ""}</h3>
        <button
          className="btn btn-secondary mb-3"
          onClick={() => setTela("restaurantes")}
        >
          Trocar de restaurante
        </button>
        <div className="row">
          {cardapio.map((item) => (
            <div className="col-md-4 mb-3" key={item.id}>
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">{item.nome}</h5>
                  <h6 className="card-subtitle mb-2 text-muted">
                    R$ {item.preco.toFixed(2)}
                  </h6>
                  <p className="card-text">{item.descricao}</p>
                  <button
                    className="btn btn-success"
                    onClick={() => addItem(item)}
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <h4 className="mt-4">Seu Pedido</h4>
        <ul>
          {pedido.itens.map((item) => (
            <li key={item.produtoId}>
              {item.nomeProduto} - {item.quantidade} x R${" "}
              {item.precoUnitario.toFixed(2)}
              <button
                className="btn btn-sm btn-outline-danger ml-2"
                onClick={() => removeItem(item.produtoId)}
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
        <div className="mb-3">
          <strong>Total: R$ {valorTotal.toFixed(2)}</strong>
        </div>
        {statusPedido && (
          <div className="alert alert-info">{statusPedido}</div>
        )}
        <button
          className="btn btn-primary mr-2"
          onClick={efetuarPedido}
        >
          Efetuar Pedido
        </button>
        <button className="btn btn-secondary" onClick={buscarPedidosCliente}>
          Ver meus pedidos
        </button>
      </div>
    );
  }

  if (tela === "acompanhamento") {
    return (
      <div className="container mt-4">
        <h2>Acompanhe seu pedido</h2>
        {statusEntrega ? (
          <div>
            <p>
              <b>Status:</b> {statusEntrega.status}
            </p>
            <p>
              <b>Entregador:</b> {statusEntrega.entregador}
            </p>
          </div>
        ) : (
          <p>Buscando status da entrega...</p>
        )}
        <button
          className="btn btn-info mt-3 mr-2"
          onClick={() => ultimoPedidoId && buscarStatusEntrega(ultimoPedidoId)}
        >
          Atualizar status
        </button>
        <button
          className="btn btn-secondary mt-3 ml-2"
          onClick={voltarParaCardapio}
        >
          Voltar ao cardápio
        </button>
        <button
          className="btn btn-primary mt-3 ml-2"
          onClick={buscarPedidosCliente}
        >
          Ver todos meus pedidos
        </button>
      </div>
    );
  }

  if (tela === "pedidos") {
    return (
      <div className="container mt-4">
        <h2>Meus pedidos</h2>
        {statusEntrega && pedidoSelecionado && (
          <div className="alert alert-info">
            <strong>Status do Pedido {pedidoSelecionado}:</strong>
            <br />
            Status: {statusEntrega.status}
            <br />
            Entregador: {statusEntrega.entregador}
          </div>
        )}
        {pedidosCliente.length === 0 ? (
          <p>Nenhum pedido encontrado.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID Pedido</th>
                <th>Status</th>
                <th>Entregador</th>
                <th>Valor Total</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {pedidosCliente.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.status}</td>
                  <td>
                    {p.nomeEntregador || p.entregadorId || '-'}
                  </td>
                  <td>
                    {p.valorTotal?.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }) || '-'}
                  </td>
                  <td>
                    <button
                      className="btn btn-info btn-sm"
                      onClick={() => buscarStatusEntrega(p.id)}
                    >
                      Ver status
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <button className="btn btn-secondary" onClick={voltarParaCardapio}>
          Voltar ao cardápio
        </button>
      </div>
    );
  }

  return <div className="container mt-4">Erro inesperado!</div>;
}

export default App;