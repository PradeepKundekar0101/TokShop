import { ProductActionDialogs } from './product-action-dialogs';
import { AuctionMiscDialogs } from './auction-misc-dialogs';

interface DialogsContainerProps {
  // Product Action Sheet
  productActionSheet: boolean;
  setProductActionSheet: (open: boolean) => void;
  selectedProduct: any;
  setSelectedProduct: (product: any) => void;
  setEditingProduct: (product: any) => void;
  setShowEditProductDialog: (show: boolean) => void;
  handlePinProduct: () => void;
  pinnedProduct: any;
  isLive: boolean;
  show: any;
  isShowOwner: boolean;
  handleOpenAuctionSettings: () => void;
  handleStartGiveaway: () => void;
  handleOpenFlashSaleSettings: () => void;
  setShowDeleteConfirm: (show: boolean) => void;
  giveaways: any[];
  activeFlashSale: any;
  
  // Auction Settings Dialog
  showAuctionSettingsDialog: boolean;
  setShowAuctionSettingsDialog: (show: boolean) => void;
  auctionSettings: any;
  setAuctionSettings: any;
  handleStartAuctionWithSettings: () => void;
  
  // Delete Confirmation Dialog
  showDeleteConfirm: boolean;
  deleteProductMutation: any;
  
  // Add Product Dialog
  showAddProductDialog: boolean;
  setShowAddProductDialog: (show: boolean) => void;
  addProductType: 'auction' | 'buy_now' | 'giveaway';
  id: string;
  refetchAuction: () => void;
  refetchBuyNow: () => void;
  refetchGiveaways: () => void;
  refetchShow: () => void;
  
  // Edit Product Dialog
  showEditProductDialog: boolean;
  editingProduct: any;
  
  // Share Dialog
  showShareDialog: boolean;
  setShowShareDialog: (show: boolean) => void;
  showTitle: string;
  
  // Prebid Dialog
  showPrebidDialog: boolean;
  setShowPrebidDialog: (show: boolean) => void;
  prebidAuction: any;
  setPrebidAuction: (auction: any) => void;
  prebidAmount: string;
  setPrebidAmount: (amount: string) => void;
  prebidMutation: any;
  toast: any;
  currentUserId?: string;
  
  // Order Detail Dialog
  showOrderDetailDialog: boolean;
  setShowOrderDetailDialog: (show: boolean) => void;
  selectedOrder: any;
  orderItemsPage: number;
  setOrderItemsPage: (page: number) => void;
}

export function DialogsContainer(props: DialogsContainerProps) {
  return (
    <>
      <ProductActionDialogs
        productActionSheet={props.productActionSheet}
        setProductActionSheet={props.setProductActionSheet}
        selectedProduct={props.selectedProduct}
        setSelectedProduct={props.setSelectedProduct}
        setEditingProduct={props.setEditingProduct}
        setShowEditProductDialog={props.setShowEditProductDialog}
        handlePinProduct={props.handlePinProduct}
        pinnedProduct={props.pinnedProduct}
        isLive={props.isLive}
        show={props.show}
        isShowOwner={props.isShowOwner}
        handleOpenAuctionSettings={props.handleOpenAuctionSettings}
        handleStartGiveaway={props.handleStartGiveaway}
        handleOpenFlashSaleSettings={props.handleOpenFlashSaleSettings}
        setShowDeleteConfirm={props.setShowDeleteConfirm}
        giveaways={props.giveaways}
        activeFlashSale={props.activeFlashSale}
        showDeleteConfirm={props.showDeleteConfirm}
        deleteProductMutation={props.deleteProductMutation}
        showAddProductDialog={props.showAddProductDialog}
        setShowAddProductDialog={props.setShowAddProductDialog}
        addProductType={props.addProductType}
        id={props.id}
        refetchAuction={props.refetchAuction}
        refetchBuyNow={props.refetchBuyNow}
        refetchGiveaways={props.refetchGiveaways}
        refetchShow={props.refetchShow}
        showEditProductDialog={props.showEditProductDialog}
        editingProduct={props.editingProduct}
      />
      
      <AuctionMiscDialogs
        showAuctionSettingsDialog={props.showAuctionSettingsDialog}
        setShowAuctionSettingsDialog={props.setShowAuctionSettingsDialog}
        auctionSettings={props.auctionSettings}
        setAuctionSettings={props.setAuctionSettings}
        handleStartAuctionWithSettings={props.handleStartAuctionWithSettings}
        showShareDialog={props.showShareDialog}
        setShowShareDialog={props.setShowShareDialog}
        showTitle={props.showTitle}
        id={props.id}
        showPrebidDialog={props.showPrebidDialog}
        setShowPrebidDialog={props.setShowPrebidDialog}
        prebidAuction={props.prebidAuction}
        setPrebidAuction={props.setPrebidAuction}
        prebidAmount={props.prebidAmount}
        setPrebidAmount={props.setPrebidAmount}
        prebidMutation={props.prebidMutation}
        toast={props.toast}
        currentUserId={props.currentUserId}
        showOrderDetailDialog={props.showOrderDetailDialog}
        setShowOrderDetailDialog={props.setShowOrderDetailDialog}
        selectedOrder={props.selectedOrder}
        orderItemsPage={props.orderItemsPage}
        setOrderItemsPage={props.setOrderItemsPage}
      />
    </>
  );
}
