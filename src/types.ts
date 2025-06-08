export interface ItemPedido {
  produtoId: string;
  nomeProduto: string;
  quantidade: number;
  precoUnitario: number;
}

export interface Pedido {
  id: string;
  clienteId: string;
  clienteNome: string;
  itens: ItemPedido[];
  valorTotal: number;
  status: string;
  entregadorId?: string | null;
  statusEntrega?: string; 
  nomeEntregador?: string;

}

export interface ItemCardapioDTO {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
}

export interface StatusEntregadorDTO {
  nomeEntregador: string;
  statusEntrega: string;
}

type RestauranteResumoDTO = {
  id: string;
  nome: string;
  endereco?: string;
};
