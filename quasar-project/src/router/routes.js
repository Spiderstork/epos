const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      { path: 'add_item', component: () => import('pages/add_items.vue') },
      { path: 'add_stock', component: () => import('pages/add_stock.vue') },
      { path: 'payment', component: () => import('pages/PaymentPage.vue') },
      { path: 'update_item', component: () => import('pages/update_item.vue') },
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
