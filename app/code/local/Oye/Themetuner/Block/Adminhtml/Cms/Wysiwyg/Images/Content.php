<?php
/**
 * Media uploader override.
 *
 * @category   Oye
 * @package    Oye_Themetuner
 * @author     OYE NETWORK LLC <oyenetwork@oyenetwork.com>
 */
class Oye_Themetuner_Block_Adminhtml_Cms_Wysiwyg_Images_Content extends Mage_Adminhtml_Block_Cms_Wysiwyg_Images_Content {
    public function getOnInsertUrl()
    {
        $useFileUrl = (int)$this->getRequest()->getParam('use_file_url', 0);
        return $this->getUrl('*/*/onInsert', array('use_file_url' => $useFileUrl));
    }
}
