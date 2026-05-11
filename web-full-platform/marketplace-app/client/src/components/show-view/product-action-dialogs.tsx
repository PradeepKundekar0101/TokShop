import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Edit, Trash, Play, Bookmark, Loader2, AlertTriangle, Zap
} from 'lucide-react';
import { ProductForm } from '@/components/product-form';

interface ProductActionDialogsProps {
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
}

export function ProductActionDialogs(props: ProductActionDialogsProps) {
  const {
    productActionSheet, setProductActionSheet, selectedProduct, setSelectedProduct,
    setEditingProduct, setShowEditProductDialog, handlePinProduct, pinnedProduct,
    isLive, show, isShowOwner, handleOpenAuctionSettings, handleStartGiveaway,
    handleOpenFlashSaleSettings, setShowDeleteConfirm, giveaways, activeFlashSale,
    showDeleteConfirm, deleteProductMutation, showAddProductDialog, setShowAddProductDialog,
    addProductType, id, refetchAuction, refetchBuyNow, refetchGiveaways, refetchShow, showEditProductDialog,
    editingProduct
  } = props;

  return (
    <>
      {/* Product Action Dialog */}
      <Dialog open={productActionSheet} onOpenChange={setProductActionSheet}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">{selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 mt-2">
            {/* Edit Product */}
            <Button
              variant="ghost"
              className="w-full justify-start text-white hover:bg-zinc-800"
              onClick={() => {
                setEditingProduct(selectedProduct);
                setProductActionSheet(false);
                setShowEditProductDialog(true);
              }}
              data-testid="button-sheet-edit"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            
            {/* Pin/Unpin - Only show for buy_now products */}
            {(selectedProduct?.saletype === 'buy_now' || selectedProduct?.listing_type === 'buy_now') && (
              <Button
                variant="ghost"
                className="w-full justify-start text-white hover:bg-zinc-800"
                onClick={handlePinProduct}
                data-testid="button-sheet-pin"
              >
                <Bookmark className="h-4 w-4 mr-2" />
                {pinnedProduct?._id === selectedProduct?._id ? 'Unpin' : 'Pin'}
              </Button>
            )}
            
            {/* Start Auction - Only show when show is live/started */}
            {(isLive || show?.started) && isShowOwner && (selectedProduct?.saletype === 'auction' || selectedProduct?.listing_type === 'auction') && (
              <Button
                variant="ghost"
                className="w-full justify-start text-white hover:bg-zinc-800"
                onClick={handleOpenAuctionSettings}
                data-testid="button-sheet-start-auction"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Auction
              </Button>
            )}
            
            {/* Start Giveaway - Only show for giveaway products when show is live/started */}
            {(isLive || show?.started) && isShowOwner && (
              selectedProduct?.saletype === 'giveaway' || 
              selectedProduct?.listing_type === 'giveaway' ||
              giveaways.some((g: any) => g._id === selectedProduct?._id)
            ) && (
              <Button
                variant="ghost"
                className="w-full justify-start text-white hover:bg-zinc-800"
                onClick={handleStartGiveaway}
                data-testid="button-sheet-start-giveaway"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Giveaway
              </Button>
            )}
            
            {/* Start Flash Sale - Only show for buy_now products that have flash_sale enabled, when show is live/started and no active flash sale */}
            {/* Pins the product immediately so seller can manually start the flash sale */}
            {(isLive || show?.started) && isShowOwner && !activeFlashSale && selectedProduct?.flash_sale && (
              selectedProduct?.saletype === 'buy_now' || 
              selectedProduct?.listing_type === 'buy_now'
            ) && (
              <Button
                variant="ghost"
                className="w-full justify-start text-yellow-500 hover:bg-zinc-800 hover:text-yellow-400"
                onClick={handlePinProduct}
                data-testid="button-sheet-start-flash-sale"
              >
                <Zap className="h-4 w-4 mr-2" />
                Start Flash Sale
              </Button>
            )}
            
            
            {/* Delete Product */}
            <Button
              variant="ghost"
              className="w-full justify-start text-red-500 hover:bg-zinc-800 hover:text-red-400"
              onClick={() => {
                setProductActionSheet(false);
                setShowDeleteConfirm(true);
              }}
              data-testid="button-sheet-delete"
            >
              <Trash className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <DialogTitle className="text-white text-lg">Delete Product</DialogTitle>
            </div>
            <DialogDescription className="text-zinc-400">
              Are you sure you want to delete "{selectedProduct?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button
              variant="ghost"
              className="flex-1 text-white hover:bg-zinc-800"
              onClick={() => {
                setShowDeleteConfirm(false);
                setSelectedProduct(null);
              }}
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => {
                if (selectedProduct?._id || selectedProduct?.id) {
                  deleteProductMutation.mutate(selectedProduct._id || selectedProduct.id);
                }
              }}
              disabled={deleteProductMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteProductMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Product Dialog */}
      {showAddProductDialog && (
        <Dialog open={showAddProductDialog} onOpenChange={setShowAddProductDialog}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-xl max-h-[85vh] p-0">
            <div className="sticky top-0 bg-zinc-900 px-6 pt-6 pb-4 border-b border-zinc-800 z-10">
              <DialogTitle className="text-white text-lg">
                Add Listing
              </DialogTitle>
            </div>
            <div className="overflow-y-auto px-6 py-4" style={{ maxHeight: 'calc(85vh - 80px)' }}>
              <ProductForm
                listingType={addProductType}
                roomId={id}
                onSuccess={() => {
                  setShowAddProductDialog(false);
                  // Refetch products based on type
                  if (addProductType === 'auction') refetchAuction();
                  if (addProductType === 'buy_now') refetchBuyNow();
                  if (addProductType === 'giveaway') refetchGiveaways();
                }}
                onCancel={() => setShowAddProductDialog(false)}
                submitButtonText="Create Product"
                showCancelButton={true}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Product Dialog */}
      {showEditProductDialog && editingProduct && (
        <Dialog open={showEditProductDialog} onOpenChange={setShowEditProductDialog}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-xl max-h-[85vh] p-0">
            <div className="sticky top-0 bg-zinc-900 px-6 pt-6 pb-4 border-b border-zinc-800 z-10">
              <DialogTitle className="text-white text-lg">
                Edit Listing
              </DialogTitle>
            </div>
            <div className="overflow-y-auto px-6 py-4" style={{ maxHeight: 'calc(85vh - 80px)' }}>
              <ProductForm
                listingType={
                  // Check if it's a giveaway by looking in the giveaways array
                  giveaways.some((g: any) => g._id === editingProduct?._id)
                    ? 'giveaway'
                    : (editingProduct?.listing_type || editingProduct?.saletype || 'buy_now')
                }
                roomId={id}
                existingProduct={editingProduct}
                onSuccess={() => {
                  setShowEditProductDialog(false);
                  setEditingProduct(null);
                  // Refetch products based on type
                  const isGiveaway = giveaways.some((g: any) => g._id === editingProduct?._id);
                  const listingType = isGiveaway ? 'giveaway' : (editingProduct?.listing_type || editingProduct?.saletype);
                  if (listingType === 'auction') refetchAuction();
                  if (listingType === 'buy_now') refetchBuyNow();
                  if (listingType === 'giveaway') refetchGiveaways();
                  // Also refetch show to update show.pinned with latest product data
                  refetchShow();
                }}
                onCancel={() => {
                  setShowEditProductDialog(false);
                  setEditingProduct(null);
                }}
                submitButtonText="Update Product"
                showCancelButton={true}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
