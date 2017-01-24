<?php
/**
 * Translate helper. Rewrite by OYE.
 * Needed for loading tune specific translations.
 *
 * @category   Oye
 * @package    Oye_Themetuner
 * @author     OYE NETWORK LLC <oyenetwork@oyenetwork.com>
 */
class Oye_Themetuner_Helper_Core_Translate extends Mage_Core_Helper_Translate
{
    /**
     * Save translation data to database for specific area - Themetuner specific functionality.
     *
     * @param array  $translate
     * @param string $area
     * @param string $returnType
     * @return string
     */
    public function themetunerApply($translate, $area, $returnType = 'json')
    {
        try {
            if ($area) {
                Mage::getDesign()->setArea($area);
            }
            Mage::getModel('core/translate_inline')->processThemetunerAjaxPost($translate);
            return $returnType == 'json' ? "{success:true}" : true;
        } catch (Exception $e) {
            return $returnType == 'json' ? "{error:true,message:'" . $e->getMessage() . "'}" : false;
        }
    }
}
