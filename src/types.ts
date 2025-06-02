export interface ItemCardapio {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
}

export interface ItemPedido {
  produtoId: string;
  nomeProduto: string;
  quantidade: number;
  precoUnitario: number;
}

export interface Pedido {
  id?: string; // só estará preenchido após criar pedido
  clienteId: string;
  itens: ItemPedido[];
  valorTotal?: number;
  status?: string;
}